import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
    // state variables
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    //functions
    const handleEmailLogin = async () => {
        setError('');
        if(!email || !password) {
            setError('Please fill all the fields!');
            return;   
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                navigate('/');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Network Error. Please try again');
        }
    }

    const handleGoogleLogin = async () => {
        window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#282828] via-[#3c3836] to-[#282828] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-[#3c3836] rounded-lg border border-[#504945] flex flex-col p-4">
                <h3 className="text-2xl font-bold text-[#ebdbb2] mb-3">Login</h3>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
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
                <input id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                      setError('');
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                        handleEmailLogin();
                    }
                  }}
                  placeholder="Enter Password"
                  className="w-full bg-[#504945] text-[#ebdbb2] px-4 py-3 rounded-lg mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#b8bb26]"
                  maxLength={50}
                />
                {error && (
                  <p className="text-[#fb4934] text-sm mb-3">{error}</p>
                )}
                <button
                  onClick={handleEmailLogin}
                  className="w-full bg-[#83a598] hover:bg-[#458588] text-[#282828] font-bold py-4 px-8 rounded-lg text-lg transition-colors transform hover:scale-105"
                >
                  Login
                </button>
                <p className="text-[#928374] mb-3">Don't have an account?</p>
                <Link to="/register" className="text-[#83a598] hover:text-[#458588] underline text-lg">Register</Link>
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

export default Login;