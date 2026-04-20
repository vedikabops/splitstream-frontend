import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api';

function Register() {
    // state variables
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordMatch, setPasswordMatch] = useState(null);
    const [username, setUsername] = useState('');
    const [error, setError] = useState(null);
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();

    //functions
    const handleRegister = async () => {
        console.log('Register Clicked');
        setError('');
        if(password !== confirmPassword) {
            setError('Passwords do not Match!');
            return;
        }
        if(!username || !email || !password || !confirmPassword) {
            setError('Please fill all the fields!');
            return;   
        }
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: username, email, password })
            });
            const data = await response.json();
            if (response.ok) {
                navigate('/login');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
           setError('Network Error. Please try again');
        }
    }

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    const getStrongPassword = (password) => {
        let strength = 0;

        if (password.length >= 8) strength++;
        if (/\d/.test(password)) strength++;  // has number 
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++; // has special char
        return strength;
    };

    const handleGoogleLogin = async () => {
        window.location.href = `${API_BASE_URL}/auth/google`;
    }


    return (
        <div className="min-h-screen bg-gradient-to-br from-[#282828] via-[#3c3836] to-[#282828] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#3c3836] rounded-lg border border-[#504945] flex flex-col p-4">
                <h2 className="text-2xl font-bold text-[#ebdbb2] mb-3">Register</h2>
                <input id="username-input"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                      setError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('email-input').focus();
                    }
                  }}
                  placeholder="Enter Username"
                  className="w-full bg-[#504945] text-[#ebdbb2] px-4 py-3 rounded-lg mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#b8bb26]"
                  maxLength={50}
                />
                <input id="email-input"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmail(value);
                    if (!isValidEmail(value) && value) {
                        setEmailError('Invalid Email Format');
                    } else {
                        setEmailError('');
                    }
                    setError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('password-input').focus();
                    }
                  }}
                  placeholder="Enter Email ID"
                  className="w-full bg-[#504945] text-[#ebdbb2] px-4 py-3 rounded-lg mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#b8bb26]"
                  maxLength={50}
                />
                {emailError && (
                    <p className="text-[#fb4934] text-sm -mt-3 mb-3">{emailError}</p>
                )}
                <input id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPassword(value);
                    setPasswordStrength(getStrongPassword(value));
                    setError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        document.getElementById('confirm-password-input').focus();
                    }
                  }}
                  placeholder="Enter Password"
                  className="w-full bg-[#504945] text-[#ebdbb2] px-4 py-3 rounded-lg mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#b8bb26]"
                  maxLength={50}
                />
                <div className="mt-2">
                    <p className="text-sm text-[#928374]">
                        Password Strength: 
                        <span className={
                        passwordStrength === 0 ? "text-[#fb4934]" :
                        passwordStrength === 1 ? "text-[#fe8019]" :
                        passwordStrength === 2 ? "text-[#fabd2f]" :
                        "text-[#b8bb26]"
                        }>
                        {passwordStrength === 0 ? " Too Weak" :
                        passwordStrength === 1 ? " Weak" :
                        passwordStrength === 2 ? " Medium" :
                        " Strong"}
                        </span>
                    </p>
                    <p className="p-3 text-sm text-[#ebdbb2]">Password should have more than 8 characters, and contain at least one number and special character.</p>
                </div>
                <input id="confirm-password-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setConfirmPassword(value);
                    if (value) {
                        setPasswordMatch(password === value);
                    } else {
                        setPasswordMatch(null); // Reset if field is empty
                    }
                    setError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                        handleRegister();
                    }
                  }}
                  placeholder="Confirm Password"
                  className="w-full bg-[#504945] text-[#ebdbb2] px-4 py-3 rounded-lg mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#b8bb26]"
                  maxLength={50}
                />
                {passwordMatch !== null && (
                    <p className={`text-sm -mt-3 mb-3 ${passwordMatch ? "text-[#b8bb26]" : "text-[#fb4934]"}`}>
                        {passwordMatch ? "✓ Passwords match" : "✗ Passwords don't match"}
                    </p>
                )}
                {error && (
                  <p className="text-[#fb4934] text-sm mb-3">{error}</p>
                )}
                <button
                  onClick={handleRegister}
                  className="w-full bg-[#83a598] hover:bg-[#458588] text-[#282828] font-bold py-4 px-8 rounded-lg text-lg transition-colors transform hover:scale-105"
                >
                  Create Account
                </button>
                <p className="text-[#928374] mb-3">Already have an account?</p>
                <Link to="/login" className="text-[#83a598] hover:text-[#458588] underline text-lg">Login</Link>
                <p className="text-[#928374] text-bold mb-6">OR</p>
                <div className="bg-[#3c3836] rounded-2xl p-8 border-2 border-[#504945]">
                    <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-[#504945] text-[#ebdbb2]  border-[#504945] hover:border-[#b8bb26] font-bold py-4 px-8 rounded-lg text-lg transition-colors transform hover:scale-105"
                    >
                    Sign in with Google
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Register;