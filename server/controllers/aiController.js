const { spawn } = require('child_process');
const path = require('path');

const handleChat = async (req, res) => {
    try {
        // Extract business_id from session
        const business_id = req.session?.business_id;
        const { user_query } = req.body;

        if (!business_id) {
            return res.status(401).json({ error: 'Unauthorized: No active business session found.' });
        }

        if (!user_query) {
            return res.status(400).json({ error: 'Bad Request: user_query is required.' });
        }

        // Build dynamic path to the python engine script
        const scriptPath = path.join(__dirname, '..', 'ai_engine', 'engine.py');

        // Execute python engine script with arguments safely using spawn
        // This avoids command injection vulnerabilities
        const pythonProcess = spawn('python', [scriptPath, String(business_id), String(user_query)]);

        let stdoutData = '';
        let stderrData = '';

        pythonProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                console.error(`stderr: ${stderrData}`);
                return res.status(500).json({ error: 'AI processing failed' });
            }

            res.json({ response: stdoutData.trim() });
        });

    } catch (err) {
        console.error('Error in aiController:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    handleChat
};
