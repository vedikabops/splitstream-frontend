import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RoomTypeModal from '../components/RoomTypeModal';
import { API_BASE_URL } from '../lib/api';

function Home() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [activeUsers, setActiveUsers] = useState(0);
  const [activeRooms, setActiveRooms] = useState(0);
  const [user, setUser] = useState(null); 
  const [error, setError] = useState('');
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false);

  useEffect (() => {
    fetch(`${API_BASE_URL}/health`)
      .then(res => res.json())
      .then(data => {
        setActiveRooms(data.activeRooms || 0);
        setActiveUsers(data.totalUsers || 0);
      })
      .catch(err => console.error('Failed to fetch stats:', err));
    
    fetch(`${API_BASE_URL}/api/user`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        console.log('User data from API:', data);
        setUser(data);
      })
      .catch(err => console.error('Failed to fetch stats:', err));

    //refreshing stats every 10 secs
    const interval = setInterval(() => {
      fetch(`${API_BASE_URL}/health`)
        .then(res => res.json())
        .then(data => {
          setActiveRooms(data.activeRooms || 0);
          setActiveUsers(data.totalUsers || 0);
        })
        .catch(err => console.error('Failed to fetch stats:', err));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const generateRoomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const handleCreateRoom = async () => {
    if (user) {
      setShowRoomTypeModal(true);
    } else {
      const roomCode = generateRoomCode();
      navigate(`/room/${roomCode}`);
    }
  };

  const handleSelectType = async (roomType) => {
    setShowRoomTypeModal(false);
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/create`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({roomType: roomType }) 
      });
      const data = await response.json();   
      if (response.ok) {  
        navigate(`/room/${data.roomCode}`);
      } else {
        console.error('Failed to create room:', data.error);
      }
    } catch (err) {
      console.error("Failed to create room:", err);
    }
  }

  const handleJoinRoom = () => {
    if(!joinCode.trim()){
      setError('Please enter a room code');
      return;
    }

    const cleanCode = joinCode.trim().toUpperCase().replace(/\s/g, '');
    navigate(`/room/${cleanCode}`);
  };




  return (
    <div className="min-h-screen bg-gradient-to-br from-[#282828] via-[#3c3836] to-[#282828]">
    <Navbar user={user} />
      <div className="flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          {/*header*/}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-white mb-4">
              Watch<span className="text-[#fe8019]">Party</span>
            </h1>
            <p className="text-xl text-[#ebdbb2] mb-8">
              Watch YouTube videos together with friends!
            </p>

            {/*stats*/}
            <div className="flex justify-center gap-8 text-[#928374]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#b8bb26] rounded-full animate-pulse"></span>
                <span>{activeUsers} watching now</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#83a598]"></span>
                <span>{activeRooms} active rooms</span>
              </div>
            </div>
          </div>

          {/*actions*/}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/*create room*/}
            <div className="bg-[#3c3836] rounded-2xl p-8 border-2 border-[#504945] hover:border-[#fe8019] transition-all">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#ebdbb2] mb-3">Create Room</h2>
                <p className="text-[#928374] mb-6">
                  Start a new watch party and invite your friends
                </p>
                <button 
                  onClick={handleCreateRoom}
                  className="w-full bg-[#fe8019] hover:bg-[#d65d0e] text-[#282828] font-bold py-4 px-8 rounded-lg text-lg transition-colors transform hover:scale-105"
                >
                  Create New Room
                </button>
              </div>
            </div>

            {/*Join Room*/}
            <div className="bg-[#3c3836] rounded-2xl p-8 border-2 border-[#504945] hover:border-[#b8bb26]  transition-all">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#ebdbb2] mb-3">Join Room</h2>
                <p className="text-[#928374] mb-6">Enter a room code to join an existing party</p>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value);
                      setError('');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                  placeholder="Enter room code"
                  className="w-full bg-[#504945] text-[#ebdbb2] px-4 py-3 rounded-lg mb-4 text-center text-lg uppercase focus:outline-none focus:ring-2 focus:ring-[#b8bb26]"
                  maxLength={10}
                />
                {error && (
                  <p className="text-[#fb4934] text-sm mb-3">{error}</p>
                )}
                <button
                  onClick={handleJoinRoom}
                  disabled={!joinCode.trim()}
                  className="w-full bg-[#b8bb26] hover:bg-[#98971a] disabled:bg-[#504945] disabled:cursor-not-allowed text-[#282828] font-bold py-4 px-8 rounded-lg text-lg transition-colors transform hover:scale-105"
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>  
        </div>
      </div>
      <RoomTypeModal isOpen={showRoomTypeModal} onClose={() => setShowRoomTypeModal(false)} onSelectType={handleSelectType} />
    </div>
  );
}

export default Home;
