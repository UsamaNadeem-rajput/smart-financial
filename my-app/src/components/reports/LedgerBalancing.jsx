import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../layout/Navbar';
import { useBusiness } from '../../context/BusinessContext';

const currency = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n || 0));

const formatClosing = (debits, credits) => {
  const diff = Number(debits || 0) - Number(credits || 0);
  if (diff === 0) return currency(0);
  return `${currency(Math.abs(diff))} ${diff > 0 ? 'Dr' : 'Cr'}`;
};

const normalizeOppositeAccounts = (entry) => {
  if (!entry?.opposite_accounts) return [];
  if (Array.isArray(entry.opposite_accounts)) return entry.opposite_accounts.filter(Boolean);
  try {
    return JSON.parse(entry.opposite_accounts).filter(Boolean);
  } catch {
    return [];
  }
};

const LedgerBalancing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedBusiness, refreshTrigger } = useBusiness();
  const searchParams = new URLSearchParams(location.search);
  const queryId = searchParams.get('id') || searchParams.get('account_id');
  const queryName = searchParams.get('name') || searchParams.get('account_name');
  const rawSelection = location.state?.selectedLedger ?? (queryId ? { id: queryId, name: queryName } : 'all');
  const apiUrl = import.meta.env.VITE_BACKEND_URL;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allLedgers, setAllLedgers] = useState([]);
  const [totals, setTotals] = useState({ total_debits: 0, total_credits: 0, balanced: true });
  const [ledgerDetails, setLedgerDetails] = useState(null);
  const [currentLedger, setCurrentLedger] = useState({ id: null, name: '' });

  const isAll = rawSelection === 'all';

  let initialTargetId = null;
  let initialTargetName = '';

  if (typeof rawSelection === 'object' && rawSelection !== null) {
    initialTargetId = rawSelection.id || rawSelection.account_id || null;
    initialTargetName = rawSelection.name || rawSelection.account_name || '';
  } else if (typeof rawSelection === 'number' || (typeof rawSelection === 'string' && /^\d+$/.test(rawSelection.trim()))) {
    initialTargetId = Number(rawSelection);
  } else if (typeof rawSelection === 'string' && rawSelection !== 'all') {
    initialTargetName = rawSelection.trim();
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBusiness?.business_id) return;
      setLoading(true);
      setError('');
      try {
        if (isAll) {
          const { data } = await axios.get(`${apiUrl}/api/ledger-balancing/${selectedBusiness.business_id}`, { withCredentials: true });
          setAllLedgers(data.ledgers || []);
          setTotals(data.totals || { total_debits: 0, total_credits: 0, balanced: true });
          setLedgerDetails(null);
          setCurrentLedger({ id: null, name: '' });
        } else {
          let targetId = initialTargetId;
          let targetName = initialTargetName;

          // If we only have accountName and not accountId, query all ledgers first to look up the ID
          if (!targetId && targetName) {
            const { data: allData } = await axios.get(
              `${apiUrl}/api/ledger-balancing/${selectedBusiness.business_id}`,
              { withCredentials: true }
            );
            const matched = (allData.ledgers || []).find(
              (l) => l.account_name.toLowerCase() === targetName.toLowerCase()
            );
            if (matched) {
              targetId = matched.account_id;
              targetName = matched.account_name;
            }
          }

          if (targetId) {
            const { data } = await axios.get(
              `${apiUrl}/api/ledger-balancing/${selectedBusiness.business_id}/${targetId}`,
              { withCredentials: true }
            );
            setLedgerDetails(data.account ? { ...data.account, ...data.totals, entries: data.entries } : null);
            const finalName = data.account?.account_name || targetName || `Account #${targetId}`;
            setCurrentLedger({ id: targetId, name: finalName });
          } else {
            setError(targetName ? `Ledger "${targetName}" not found.` : 'No ledger selected.');
            setLedgerDetails(null);
          }
        }
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Failed to load ledger balancing data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusiness?.business_id, isAll ? 'all' : initialTargetId || initialTargetName, refreshTrigger]);

  const header = useMemo(() => (
    <div className="flex justify-between items-center flex-wrap gap-3">
      <p className="text-brand-muted text-[15px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="hover:underline text-brand-muted cursor-pointer"
        >
          Reports
        </button>
        {' / '}
        <span className="text-brand-ink font-medium">Ledger balancing</span>
      </p>
      <button
        type="button"
        className="sf-lb-lk font-semibold text-sm"
        onClick={() => {
          if (!isAll) {
            navigate('/ledger-balancing', { state: { selectedLedger: 'all' } });
          } else {
            navigate(-1);
          }
        }}
      >
        {!isAll ? '← View All Ledgers' : '← Back to Reports'}
      </button>
    </div>
  ), [navigate, isAll]);

  return (
    <div className="min-h-screen bg-[#F2F5EE] text-[#0E1A14] font-sans">
      <Navbar />

      <main className="max-w-[1240px] mx-auto px-4 sm:px-8 pt-8 pb-20">
        {header}

        <h1 className="font-display font-extrabold text-[44px] sm:text-[76px] tracking-tight leading-[0.98] mt-3.5 mb-2 text-brand-ink">
          Ledger Balancing.
        </h1>

        {isAll ? (
          /* ================= VIEW: ALL LEDGERS SUMMARY ================= */
          <div>
            <p className="text-brand-muted text-lg sm:text-xl max-w-[760px] mt-4 leading-normal">
              Every ledger in one index. Open one to see how its balance was built, side by side.
            </p>

            {loading ? (
              <div className="py-20 text-center text-brand-muted font-medium">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-ink border-t-brand-lime mb-3"></div>
                <div>Loading ledger balances...</div>
              </div>
            ) : error ? (
              <div className="sf-lb-bad my-6" role="alert">
                <div className="h">
                  <h2>Error Loading Ledgers</h2>
                  <p>{error}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="sf-lb-tot">
                  <div>
                    <span>Total debits</span>
                    <b>{currency(totals.total_debits)}</b>
                  </div>
                  <div>
                    <span>Total credits</span>
                    <b>{currency(totals.total_credits)}</b>
                  </div>
                  <div>
                    <span className={totals.balanced ? 'sf-lb-ok' : 'sf-lb-unbal'}>
                      {totals.balanced ? 'Balanced' : 'Out of balance'}
                    </span>
                  </div>
                </div>

                <div className="sf-lb-sm">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Ledger</th>
                        <th scope="col">Type</th>
                        <th scope="col" className="n">Debits ($)</th>
                        <th scope="col" className="n">Credits ($)</th>
                        <th scope="col" className="n">Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allLedgers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center text-brand-muted py-8 font-medium">
                            No ledger accounts found for this business.
                          </td>
                        </tr>
                      ) : (
                        allLedgers.map((l) => {
                          const closing = formatClosing(l.total_debits, l.total_credits);
                          const parts = closing.split(' ');
                          const val = parts[0] || '0.00';
                          const side = parts[1] || '';
                          return (
                            <tr
                              key={l.account_id}
                              className="lr"
                              onClick={() =>
                                navigate('/ledger-balancing', {
                                  state: { selectedLedger: { id: l.account_id, name: l.account_name } },
                                })
                              }
                            >
                              <td className="ln">
                                <span>{l.account_name}</span>
                                <span className="ar">→</span>
                              </td>
                              <td className="ty">{l.type_name || 'General Ledger'}</td>
                              <td className="n">{currency(l.total_debits)}</td>
                              <td className="n">{currency(l.total_credits)}</td>
                              <td className="n">
                                <b>{val}</b> {side && <small>{side}</small>}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="sf-lb-hint">
                  Click a ledger row to open its detailed T-account balancing sheet.
                </p>

                {!totals.balanced && (
                  <div className="mt-8">
                    <p className="sf-lb-lab">State · the whole business does not balance</p>
                    <div className="sf-lb-bad" role="alert">
                      <div className="h">
                        <h2>Debits and credits do not match.</h2>
                        <p>
                          Total debits are {currency(totals.total_debits)} and total credits are{' '}
                          {currency(totals.total_credits)} across all ledgers. Check the General Journal for an
                          incomplete entry.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* ================= VIEW: INDIVIDUAL T-ACCOUNT ================= */
          <div>
            <div className="sf-lb-bk">
              <button
                type="button"
                onClick={() => navigate('/ledger-balancing', { state: { selectedLedger: 'all' } })}
                className="sf-lb-lk font-semibold text-sm"
              >
                ← View all ledgers
              </button>
            </div>

            {allLedgers.length > 0 ? (
              <div className="sf-lb-chips" role="group" aria-label="Choose another ledger">
                {allLedgers.map((l) => {
                  const isCurrent =
                    Number(l.account_id) === Number(currentLedger.id || ledgerDetails?.account_id);
                  return (
                    <button
                      key={l.account_id}
                      type="button"
                      className={`sf-lb-cp ${isCurrent ? 'on' : ''}`}
                      onClick={() =>
                        navigate('/ledger-balancing', {
                          state: { selectedLedger: { id: l.account_id, name: l.account_name } },
                        })
                      }
                    >
                      {l.account_name}
                    </button>
                  );
                })}
              </div>
            ) : currentLedger.name ? (
              <div className="sf-lb-chips" role="group" aria-label="Choose another ledger">
                <button type="button" className="sf-lb-cp on">
                  {currentLedger.name}
                </button>
              </div>
            ) : null}

            {loading ? (
              <div className="py-20 text-center text-brand-muted font-medium">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-ink border-t-brand-lime mb-3"></div>
                <div>Loading ledger details...</div>
              </div>
            ) : error ? (
              <div className="sf-lb-bad my-6" role="alert">
                <div className="h">
                  <h2>Error Loading Ledger</h2>
                  <p>{error}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="sf-lb-hdb">
                  <div>
                    <p className="text-brand-muted text-sm font-semibold">
                      Selected ledger · ID {currentLedger.id || ledgerDetails?.account_id || initialTargetId}
                    </p>
                    <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-brand-ink tracking-tight mt-1.5">
                      {currentLedger.name || ledgerDetails?.account_name || initialTargetName}
                    </h2>
                  </div>
                  {ledgerDetails && (
                    <dl className="sf-lb-kp">
                      <div>
                        <dt>Debits</dt>
                        <dd>{currency(ledgerDetails.total_debits)}</dd>
                      </div>
                      <div>
                        <dt>Credits</dt>
                        <dd>{currency(ledgerDetails.total_credits)}</dd>
                      </div>
                      <div className="cl">
                        <dt>Closing</dt>
                        <dd>{formatClosing(ledgerDetails.total_debits, ledgerDetails.total_credits)}</dd>
                      </div>
                    </dl>
                  )}
                </div>

                {(() => {
                  const drEntries = (ledgerDetails?.entries || []).filter((e) => e.type === 'debit');
                  const crEntries = (ledgerDetails?.entries || []).filter((e) => e.type === 'credit');

                  const hasDrCd =
                    ledgerDetails && ledgerDetails.total_credits > ledgerDetails.total_debits;
                  const hasCrCd =
                    ledgerDetails && ledgerDetails.total_debits > ledgerDetails.total_credits;

                  const drList = [
                    ...drEntries.map((e) => ({
                      date: e.date,
                      particulars: (() => {
                        const accounts = normalizeOppositeAccounts(e);
                        return accounts.length
                          ? `To ${accounts.map((acc) => acc.account_name).join(', ')}`
                          : 'To Various';
                      })(),
                      description: e.description,
                      amount: currency(e.amount),
                      isCd: false,
                    })),
                    ...(hasDrCd
                      ? [
                          {
                            date: '',
                            particulars: 'c/d (Balancing Figure)',
                            description: '',
                            amount: currency(ledgerDetails.total_credits - ledgerDetails.total_debits),
                            isCd: true,
                          },
                        ]
                      : []),
                  ];

                  const crList = [
                    ...crEntries.map((e) => ({
                      date: e.date,
                      particulars: (() => {
                        const accounts = normalizeOppositeAccounts(e);
                        return accounts.length
                          ? `By ${accounts.map((acc) => acc.account_name).join(', ')}`
                          : 'By Various';
                      })(),
                      description: e.description,
                      amount: currency(e.amount),
                      isCd: false,
                    })),
                    ...(hasCrCd
                      ? [
                          {
                            date: '',
                            particulars: 'c/d (Balancing Figure)',
                            description: '',
                            amount: currency(ledgerDetails.total_debits - ledgerDetails.total_credits),
                            isCd: true,
                          },
                        ]
                      : []),
                  ];

                  const maxRows = Math.max(drList.length, crList.length);
                  const maxTotal = ledgerDetails
                    ? Math.max(ledgerDetails.total_debits, ledgerDetails.total_credits)
                    : 0;

                  const formatDate = (dStr) => {
                    if (!dStr) return '';
                    try {
                      const d = new Date(dStr);
                      if (isNaN(d.getTime())) return dStr;
                      return d.toISOString().split('T')[0];
                    } catch {
                      return dStr;
                    }
                  };

                  return (
                    <div className="sf-lb-tsc">
                      <table className="sf-lb-ta">
                        <caption className="sr-only">
                          T-account for {currentLedger.name || ledgerDetails?.account_name || initialTargetName}
                        </caption>
                        <colgroup>
                          <col className="d" />
                          <col />
                          <col className="a" />
                          <col className="d" />
                          <col />
                          <col className="a" />
                        </colgroup>
                        <thead>
                          <tr>
                            <th colSpan="3" className="side">
                              Dr. (Debit)
                            </th>
                            <th colSpan="3" className="side bl">
                              Cr. (Credit)
                            </th>
                          </tr>
                          <tr className="ch">
                            <th scope="col">Date</th>
                            <th scope="col">Particulars</th>
                            <th scope="col" className="n">
                              Amount ($)
                            </th>
                            <th scope="col" className="bl">
                              Date
                            </th>
                            <th scope="col">Particulars</th>
                            <th scope="col" className="n">
                              Amount ($)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {maxRows === 0 ? (
                            <tr>
                              <td colSpan="3" className="text-center text-brand-muted py-8 font-medium">
                                No debit transactions recorded.
                              </td>
                              <td colSpan="3" className="text-center text-brand-muted py-8 font-medium bl">
                                No credit transactions recorded.
                              </td>
                            </tr>
                          ) : (
                            Array.from({ length: maxRows }).map((_, idx) => {
                              const dr = drList[idx];
                              const cr = crList[idx];
                              return (
                                <tr key={`row-${idx}`}>
                                  <td className={`dt ${dr?.isCd ? 'cd' : ''}`}>{formatDate(dr?.date)}</td>
                                  <td className={dr?.isCd ? 'cd' : ''}>
                                    {dr?.particulars}
                                    {dr?.description && (
                                      <div className="text-xs text-brand-muted italic mt-0.5">
                                        {dr.description}
                                      </div>
                                    )}
                                  </td>
                                  <td className={`n ${dr?.isCd ? 'cd' : ''}`}>{dr?.amount || ''}</td>

                                  <td className={`dt bl ${cr?.isCd ? 'cd' : ''}`}>{formatDate(cr?.date)}</td>
                                  <td className={cr?.isCd ? 'cd' : ''}>
                                    {cr?.particulars}
                                    {cr?.description && (
                                      <div className="text-xs text-brand-muted italic mt-0.5">
                                        {cr.description}
                                      </div>
                                    )}
                                  </td>
                                  <td className={`n ${cr?.isCd ? 'cd' : ''}`}>{cr?.amount || ''}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                        <tfoot>
                          <tr>
                            <th colSpan="2" scope="row">
                              Total
                            </th>
                            <td className="n">
                              <span className="sf-lb-dbl">{currency(maxTotal)}</span>
                            </td>
                            <th colSpan="2" className="bl" scope="row">
                              Total
                            </th>
                            <td className="n">
                              <span className="sf-lb-dbl">{currency(maxTotal)}</span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  );
                })()}

                <p className="sf-lb-cbl">
                  Closing balance:{' '}
                  <b>{formatClosing(ledgerDetails?.total_debits, ledgerDetails?.total_credits)}</b>
                </p>

                <details className="sf-lb-how" open>
                  <summary>How to read a T-account</summary>
                  <div>
                    <p>
                      <b>Left side (Dr.)</b> holds the debits. Each line says &quot;To&quot; and the other
                      account involved in that transaction.
                    </p>
                    <p>
                      <b>Right side (Cr.)</b> holds the credits. Each line says &quot;By&quot; and the other
                      account.
                    </p>
                    <p>
                      <b>c/d</b> means carried down. It is the balancing figure added to the smaller side so both
                      sides total the same. The difference is the closing balance, marked Dr or Cr.
                    </p>
                  </div>
                </details>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LedgerBalancing;
