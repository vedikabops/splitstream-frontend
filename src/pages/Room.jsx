import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';

const extractVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

function Room() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const socketRef = useRef(null);
  const playerRef = useRef(null); 
  const isIncomingEvent = useRef(false);
  const isSeeking = useRef(false);

  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [username, setUsername] = useState('');
  const messagesEndRef = useRef(null);

  const [showUsernameModal, setShowUsernameModal] = useState(true);
  const [tempUsername, setTempUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [showCopied, setShowCopied] = useState(false);
  const [showCodeCopied, setShowCodeCopied] = useState(false);
  const usernameInputRef = useRef(null);
  const lastEventTime = useRef(0);
  const [isHost, setIsHost] = useState(false);
  const initiatingAction = useRef(false);

  const onPlayerStateChange = (event) => {
    // If the change came from the socket, do nothing
    if (isIncomingEvent.current) {
      isIncomingEvent.current = false;
      return;
    }
    // ignore state 3
    if (event.data === 3) {
      return;
    }

    // event.data: 1 = Playing, 2 = Paused
    if (event.data === window.YT.PlayerState.PLAYING) {
      const currentTime = playerRef.current.getCurrentTime();
      socketRef.current.emit('play-video', { roomId, timestamp: currentTime });
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      const currentTime = playerRef.current.getCurrentTime();
      socketRef.current.emit('pause-video', { roomId, timestamp: currentTime });
    }
  };

  const onPlayerSeek = () => {
    if (isIncomingEvent.current || isSeeking.current) return;

    console.log('Sending seek event, timestamp:', currentTime);
    const currentTime = playerRef.current.getCurrentTime();
    socketRef.current.emit('seek-video', { roomId, timestamp: currentTime });
  };

  useEffect(() => {
    // load YouTube SDK if not already there
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    // Setup Socket
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socketRef.current = socket;

    socket.on('connect', () => {
      if (username) {
        socket.emit('join-room', { roomId, username });
      }
    });

    socket.on('room-state', (state) => {
      if (state.videoUrl) {
        const id = extractVideoId(state.videoUrl);
        if (id) setVideoId(id);
      }
      if (state.messages) setMessages(state.messages);
      if (state.users) setUsers(state.users);
    });


    socket.on('video-loaded', (data) => {
      const id = extractVideoId(data.videoUrl);
      if (id) {
        setVideoId(id);
        setError('');
      }
    });

    // Listen for Play/Pause from others
    socket.on('video-play', (data) => {
      initiatingAction.current = true;
      const now = Date.now();
      if (now-lastEventTime.current < 200) {
        console.log('ignoring rapid play event');
        return;
      }
      lastEventTime.current = now;
      console.log('Received play event, timestamp:', data.timestamp);
      isIncomingEvent.current = true;
      if (playerRef.current && data.timestamp !== undefined) {
        const currentTime = playerRef.current.getCurrentTime();
        if (Math.abs(currentTime - data.timestamp) > 2) {
          playerRef.current.seekTo(data.timestamp, true);
        }
        playerRef.current.playVideo();
      }
      setTimeout(() => {
        //isIncomingEvent.current = false;
        initiatingAction.current = false;
      }, 500);
    });

    socket.on('video-pause', (data) => {
      initiatingAction.current = true;
      const now = Date.now();
      if (now-lastEventTime.current < 200) {
        console.log('ignoring rapid play event');
        return;
      }
      lastEventTime.current = now;
      console.log('Received pause event, timestamp:', data.timestamp);
      isIncomingEvent.current = true;
      if (playerRef.current && data.timestamp !== undefined) {
        playerRef.current.seekTo(data.timestamp, true);
        playerRef.current.pauseVideo();
      }
      setTimeout (() => {
        //isIncomingEvent.current = false;
        initiatingAction.current = false;
      }, 500);
    });

    socket.on('video-seek', (data) => {
      const now = Date.now();
      if (now-lastEventTime.current < 200) {
        console.log('ignoring rapid play event');
        return;
      }
      lastEventTime.current = now;
      console.log('Received seek event, timestamp:', data.timestamp);
      isIncomingEvent.current = true;
      isSeeking.current = true;
      if (playerRef.current && data.timestamp !== undefined) {
        playerRef.current.seekTo(data.timestamp, true);
      }
      setTimeout (() => {
        isIncomingEvent.current = false;
        isSeeking.current = false;
      }, 500);
    });

    socket.on('receive-message', (message) => {
      console.log('Received message:', message);
      setMessages(prev => [...prev, message]);
    });

    socket.on('user-joined', (data) => {
      setUsers(data.users);
      setMessages(prev => [...prev, {
        type: 'system',
        message: `${data.username} joined the room`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    });

    socket.on('user-left', (data) => {
      setUsers(data.users);
      setMessages(prev => [...prev, {
        type: 'system',
        message: `${data.username} left the room`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    });

    socket.on('users-update', (users) => {
      setUsers(users);
    });

    socket.on('error', (data) => {
      setError(data.message);
      setIsLoading(false);
    });


    return () => socket.disconnect();
  }, [roomId, username]);

  // Initialize Player when VideoId changes
  useEffect(() => {
    if (!videoId) return;

    // Small delay to ensure the 'youtube-player' div exists
    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.loadVideoById(videoId);
      } else if (window.YT && window.YT.Player) {
        playerRef.current = new window.YT.Player('youtube-player', {
          videoId: videoId,
          events: {
            'onStateChange': onPlayerStateChange,
            'onReady': (event) => {
              setIsLoading(false);
              // SET UP SEEK DETECTION
              // remove the following section - seeks every second - causes issues when delay
              /*setInterval (() => {
                if (playerRef.current && playerRef.current.getPlayerState) {
                  onPlayerSeek();
                }
              }, 1000);*/
              let lastKnownTime = 0;
              setInterval(() => {
                if (playerRef.current && playerRef.current.getPlayerState){
                  const currentTime = playerRef.current.getCurrentTime();
                  // only emit if user manually seeks i.e. jumps more than 2 seconds
                  if (Math.abs(currentTime - lastKnownTime) > 2 && !isIncomingEvent.current && !isSeeking.current) {
                    onPlayerSeek();
                  }
                  lastKnownTime = currentTime;
                }
              }, 1000);
            }
          },
        });
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, [videoId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus username input when modal opens
  useEffect(() => {
    if (showUsernameModal && usernameInputRef.current) {
      usernameInputRef.current.focus();
    }
  }, [showUsernameModal]);

  const handleSetUsername = () => {
    const name = tempUsername.trim() || `User${Math.floor(Math.random()*1000)}`;
    setUsername(name);
    setShowUsernameModal(false);
    // join room with username
    if (socketRef.current) {
      socketRef.current.emit('join-room', { roomId, username: name });
    }
  };


  const handleLoadVideo = () => {
    if (!youtubeUrl.trim()) {
      //socketRef.current.emit('load-video', { roomId, videoUrl: youtubeUrl.trim() });
      setError('Please enter a YouTube URL');
      return;
    }

    const id = extractVideoId(youtubeUrl.trim());
    if(!id) {
      setError('Invalid YouTube URL. Please check and try again.');
      return;
    }

    if (socketRef.current) {
      setIsLoading(true);
      setError('');
      socketRef.current.emit('load-video', { roomId, videoUrl: youtubeUrl.trim() });
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && socketRef.current) {
      const message = {
        roomId,
        username,
        message: messageInput.trim(),
        timestamp: new Date().toLocaleTimeString()
      };
      
      socketRef.current.emit('send-message', message);
      setMessageInput('');
    }
  };

  const copyRoomLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  const copyRoomCode = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(roomId).then(() => {
      setShowCodeCopied(true);
      setTimeout(() => setShowCodeCopied(false), 2000);
    });
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    navigate('/');
  };

  return (
    <>
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-[#3c3836] rounded-lg p-8 border border-[#504945] max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-[#ebdbb2] mb-4">Enter Your Name</h2>
            <input
              ref={usernameInputRef}
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSetUsername()}
              placeholder="Enter your name..."
              className="w-full bg-[#504945] text-[#ebdbb2] px-4 py-3 rounded-lg mb-4 focus:ring-2 focus:ring-[#fe8019]"
            />
            <button
              onClick={handleSetUsername}
              className="w-full bg-[#fe8019] hover:bg-[#d65d0e] text-[#282828] px-6 py-3 rounded-lg font-bold transition-colors"
            >
              Join Room
            </button>
          </div>
        </div>
      )}
    <div className="min-h-screen bg-[#282828] p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
        <h1 className="text-3xl font-bold text-[#ebdbb2]">Room: <span className="text-[#fe8019]">{roomId}</span>
        </h1>
        <p className="text-[#928374] text-sm">Share this code with friends to invite them</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={copyRoomCode}
            className="bg-[#d3869b] hover:bg-[#b16286] text-[#282828] px-2 py-2 rounded-lg font-semibold transition-colors relative"
          >
            {showCodeCopied ? 'Code Copied!' : 'Copy Room Code'}
          </button>
          <button 
            onClick={copyRoomLink}
            className="bg-[#b8bb26] hover:bg-[#98971a] text-[#282828] px-2 py-2 rounded-lg font-semibold transition-colors relative"
          >
            {showCopied ? 'Copied!' : 'Copy Room Link'}
          </button>
          <button 
            onClick={handleLeaveRoom}
            className="bg-[#83a598] hover:bg-[#458588] text-[#282828] px-2 py-2 rounded-lg font-semibold transition-colors relative"
          >Leave Room</button>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-120px)]">
        <div className="w-[70%] flex flex-col">
          <div className="bg-[#3c3836] rounded-lg p-6 border border-[#504945] flex-1 flex flex-col">
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleLoadVideo()}
                className="flex-1 bg-[#504945] text-[#ebdbb2] px-4 py-3 rounded-lg"
                placeholder="Paste YouTube URL..."
              />
              <button onClick={handleLoadVideo} disabled={isLoading} className="bg-[#fe8019] hover:bg-[#d65d0e] disabled:bg-[#504945] text-[#282828] px-6 py-3 rounded-lg font-bold transition-colors">
                {isLoading ? 'Loading...' : 'Load Video'}
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-[#fb4934] bg-opacity-20 border border-[#fb4934] text-[#fb4934] px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
              {/* IMPORTANT: Use a div with a specific ID, not an iframe tag */}
              <div id="youtube-player" className="w-full h-full"></div>
              
              {!videoId && (
                <div className="absolute inset-0 flex items-center justify-center text-[#928374]">
                  No video loaded
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-[30%] bg-[#3c3836] rounded-lg border border-[#504945] flex flex-col">
          {/* Users list */}
          <div className="bg-[#3c3836] rounded-lg border border-[#504945] p-4">
            <h2 className="text-lg font-bold text-[#ebdbb2] mb-3">
              Watching ({users.length})
            </h2>
            <div className ="space-y-2 max-h-32 overflow-y-auto">
              {users.map((user, index) => (
                <div key={index} className="flex items-center gap-2 text-[#ebdbb2] text-sm">
                  <span className="w-2 h-2 bg-[#b8bb26] rounded-full"></span>
                  <span>{user}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Chat Header */}
          <div className="p-4 border-b border-[#504945]">
            <h2 className="text-xl font-bold text-[#ebdbb2]">Chat</h2>
            <p className="text-sm text-[#928374]">Signed in as: {username}</p>
          </div>

          {/* Message Container*/}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-[#928374] text-center mt-4">No messages yet...</p>
            ) : (
              messages.map((msg, index) => (
                msg.type === 'system' ? (
                  <div key={index} className="text-center">
                    <span className="text-xs text-[#928374] italic">{msg.message}</span>
                  </div>
                ) : (
                  <div key={index} className={`p-3 rounded-lg ${msg.username === username ? 'bg-[#fe8019] bg-opacity-30 ml-8' : 'bg-[#504945] mr-8'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-[#ebdbb2] text-sm">{msg.username}</span>
                      <span className="text-xs text-[#928374]">{msg.timestamp}</span>
                    </div>
                    <p className="text-[#ebdbb2] text-sm">{msg.message}</p>
                  </div>
                )
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/*Message Input*/}
          <div className="p-4 border-t border-[#504945]">
            <div className="flex gap-2">
              <input type = "text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message...."
              className="flex-1 bg-[#504945] text-[#ebdbb2] px-3 py-3 rounded-lg border border-[#3c3836] focus:outline-none focus:ring-2 focus:ring-[#fe8019] text-sm"
              />
              <button
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="bg-[#fe8019] hover:bg-[#d65d0e] disabled:bg-[#504945] disabled:cursor-not-allowed text-[#282828] px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default Room;