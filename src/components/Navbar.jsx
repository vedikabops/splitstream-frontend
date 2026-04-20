import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api';

function Navbar({ user }) {
    return (
      <nav className="bg-[#282828] border-b-2 border-[#504945] py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {/* Left side - Logo */}
          <h1 className="text-2xl font-bold text-white">
            Watch<span className="text-[#fe8019]">Party</span>
          </h1>
          
          {/* Right side - User info or Login button */}
          {user ? (
            <div className="flex items-center gap-3">
                <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border-2 border-[#83a598]"
                />
              <span className="text-[#ebdbb2]">{user.name}</span>
              <button onClick={() => window.location.href = `${API_BASE_URL}/auth/logout`} className='bg-[#83a598] hover:bg-[#458588] text-[#282828] font-bold py-2 px-6 rounded-lg transition-colors'>Logout</button>
            </div>
          ) : (
            <Link
                to="/login"
                className="bg-[#83a598] hover:bg-[#458588] text-[#282828] font-bold py-2 px-6 rounded-lg transition-colors"
            >
                Login
            </Link>
          )}
        </div>
      </nav>
    );
  }
  
  export default Navbar;