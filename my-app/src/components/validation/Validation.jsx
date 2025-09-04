import React from "react";

function Validation(value) {
  let errors = {};

  if (!value.username) {
    errors.username = "This field is required";
  } else if (value.username.length < 8 || value.username.length > 20) {
    errors.username = "Username must be between 8 and 20 characters long";
  } else if (!/^[a-zA-Z0-9_]+$/.test(value.username)) {
    errors.username = "Username can only contain letters, numbers, and underscores";
  }

  if (!value.fullname) {
    errors.fullname = "This field is required";
  } else if (value.fullname.length < 5 || value.fullname.length > 20) {
    errors.fullname = "Fullname must be between 5 and 20 characters long";
  }

 
  if (!value.email) {
    errors.email = "This field is required";
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.email)) {
    errors.email = "Invalid email address";
  }

  if (!value.password) {
    errors.password = "This field is required";
  } else if (value.password.length < 6) {
    errors.password = "Password must be at least 6 characters long";
  } else if (value.password.length > 20) {
    errors.password = "Password must be less than 20 characters long";
  } else if (!/(?=.*[0-9])/.test(value.password)) {
    errors.password = "Password must contain at least one number";
  } else if (!/(?=.*[!@#$%^&*])/.test(value.password)) {
    errors.password = "Password must contain at least one special character";
  }

  return errors;
}

export default Validation;
