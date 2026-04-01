import React, { useState, useEffect, useRef, useCallback } from 'react';

const GRID_SIZE = 20;
const INITIAL_SPEED = 120;
const SPEED_INCREMENT = 3;

type Point = { x: number; y: number };

const TRACKS = [
  {
    id: 1,
    title: "DATA_STREAM_01",
    artist: "UNKNOWN_ENTITY",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "CORRUPTED_SECTOR",
    artist: "SYS_ADMIN",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: 3,
    title: "VOID_RESONANCE",
    artist: "NULL_PTR",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  }
];

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Point>({ x: 1, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Music State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Refs for game loop to avoid dependency issues
  const directionRef = useRef(direction);
  const snakeRef = useRef(snake);
  const foodRef = useRef(food);
  const gameOverRef = useRef(gameOver);
  const isPausedRef = useRef(isPaused);
  const gameStartedRef = useRef(gameStarted);

  useEffect(() => {
    directionRef.current = direction;
    snakeRef.current = snake;
    foodRef.current = food;
    gameOverRef.current = gameOver;
    isPausedRef.current = isPaused;
    gameStartedRef.current = gameStarted;
  }, [direction, snake, food, gameOver, isPaused, gameStarted]);

  // Generate random food
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Ensure food doesn't spawn on snake
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  // Game Loop
  useEffect(() => {
    const moveSnake = () => {
      if (gameOverRef.current || isPausedRef.current || !gameStartedRef.current) return;

      const currentSnake = [...snakeRef.current];
      const head = { ...currentSnake[0] };
      const currentDirection = directionRef.current;

      head.x += currentDirection.x;
      head.y += currentDirection.y;

      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        return;
      }

      // Self collision
      if (currentSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        return;
      }

      currentSnake.unshift(head);

      // Food collision
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore(s => s + 10);
        setFood(generateFood(currentSnake));
      } else {
        currentSnake.pop();
      }

      setSnake(currentSnake);
    };

    const speed = Math.max(40, INITIAL_SPEED - Math.floor(score / 50) * SPEED_INCREMENT);
    const intervalId = setInterval(moveSnake, speed);

    return () => clearInterval(intervalId);
  }, [score, generateFood]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }

      if (gameOverRef.current) {
        if (e.key === 'Enter') resetGame();
        return;
      }

      if (e.key === ' ' || e.key === 'Escape') {
        if (gameStartedRef.current) {
          setIsPaused(p => !p);
        } else {
          setGameStarted(true);
        }
        return;
      }

      if (!gameStartedRef.current) {
        setGameStarted(true);
      }

      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 1, y: 0 });
    setFood(generateFood([{ x: 10, y: 10 }]));
    if (score > highScore) setHighScore(score);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setGameStarted(true);
  };

  // Audio Controls
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Audio play failed:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [currentTrackIndex]);

  const handleAudioEnded = () => {
    nextTrack();
  };

  return (
    <div className="min-h-screen bg-black text-[#00ffff] font-digital flex flex-col items-center justify-center p-4 overflow-hidden relative">
      <div className="static-noise"></div>
      <div className="scanlines"></div>

      <div className="z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-start screen-tear">
        
        {/* Left Column: Title & Music Player */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="space-y-2">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter text-[#00ffff] glitch-text" data-text="SYS_SNAKE">
              SYS_SNAKE
            </h1>
            <p className="text-[#ff00ff] text-2xl tracking-widest border-b-4 border-[#ff00ff] pb-2 inline-block">
              PROTOCOL: GLITCH_ART
            </p>
          </div>

          {/* Music Player Widget */}
          <div className="jarring-box p-6 relative group">
            <h2 className="text-2xl text-[#ff00ff] mb-4 flex items-center gap-2 border-b-2 border-[#ff00ff] pb-1">
              <span className="w-4 h-4 bg-[#ff00ff] animate-ping"></span>
              AUDIO_STREAM // ACTIVE
            </h2>
            
            <div className="mb-6">
              <div className="text-4xl font-bold text-[#00ffff] truncate">{TRACKS[currentTrackIndex].title}</div>
              <div className="text-2xl text-[#ff00ff] truncate">SRC: {TRACKS[currentTrackIndex].artist}</div>
            </div>

            <div className="flex items-center justify-between text-3xl">
              <button onClick={prevTrack} className="hover:text-[#ff00ff] hover:bg-[#00ffff] px-2 transition-none border-4 border-transparent hover:border-[#ff00ff]">
                [ {"<<"} ]
              </button>
              
              <button onClick={togglePlay} className="hover:text-[#00ffff] hover:bg-[#ff00ff] px-4 py-1 transition-none border-4 border-[#00ffff] hover:border-[#00ffff] text-[#ff00ff]">
                {isPlaying ? "[ || ]" : "[ > ]"}
              </button>
              
              <button onClick={nextTrack} className="hover:text-[#ff00ff] hover:bg-[#00ffff] px-2 transition-none border-4 border-transparent hover:border-[#ff00ff]">
                [ {">>"} ]
              </button>

              <button onClick={toggleMute} className="hover:text-[#ff00ff] hover:bg-[#00ffff] px-2 transition-none border-4 border-transparent hover:border-[#ff00ff]">
                {isMuted ? "[ MUT ]" : "[ VOL ]"}
              </button>
            </div>

            {/* Audio Element */}
            <audio 
              ref={audioRef} 
              src={TRACKS[currentTrackIndex].url} 
              onEnded={handleAudioEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Visualizer bars (fake) */}
            <div className="flex items-end justify-between h-12 mt-6 gap-2 border-t-4 border-[#00ffff] pt-2">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-full bg-[#ff00ff]"
                  style={{ 
                    height: isPlaying ? `${Math.max(10, Math.random() * 100)}%` : '10%',
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Score Board */}
          <div className="grid grid-cols-2 gap-6">
            <div className="jarring-box-magenta p-4 flex flex-col items-start justify-center">
              <span className="text-2xl text-[#00ffff] mb-1 border-b-2 border-[#00ffff]">METRIC_01</span>
              <span className="text-6xl font-bold text-[#ff00ff]">{score}</span>
            </div>
            <div className="jarring-box p-4 flex flex-col items-start justify-center">
              <span className="text-2xl text-[#ff00ff] mb-1 border-b-2 border-[#ff00ff]">MAX_METRIC</span>
              <span className="text-6xl font-bold text-[#00ffff]">{highScore}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Game Board */}
        <div className="lg:col-span-8 flex justify-center lg:justify-end">
          <div className="jarring-box p-2">
            {/* Game Container */}
            <div 
              className="bg-black relative border-4 border-[#ff00ff] overflow-hidden"
              style={{
                width: 'min(85vw, 600px)',
                height: 'min(85vw, 600px)',
              }}
            >
              {/* Grid Background */}
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(to right, #00ffff 2px, transparent 2px), linear-gradient(to bottom, #00ffff 2px, transparent 2px)',
                  backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
                }}
              ></div>

              {/* Game Elements */}
              {gameStarted && (
                <>
                  {/* Food */}
                  <div 
                    className="absolute bg-[#ff00ff] animate-pulse"
                    style={{
                      width: `${100 / GRID_SIZE}%`,
                      height: `${100 / GRID_SIZE}%`,
                      left: `${(food.x / GRID_SIZE) * 100}%`,
                      top: `${(food.y / GRID_SIZE) * 100}%`,
                    }}
                  ></div>

                  {/* Snake */}
                  {snake.map((segment, index) => {
                    const isHead = index === 0;
                    return (
                      <div
                        key={`${segment.x}-${segment.y}-${index}`}
                        className={`absolute ${isHead ? 'bg-[#00ffff] z-10' : 'bg-[#00aaaa]'}`}
                        style={{
                          width: `${100 / GRID_SIZE}%`,
                          height: `${100 / GRID_SIZE}%`,
                          left: `${(segment.x / GRID_SIZE) * 100}%`,
                          top: `${(segment.y / GRID_SIZE) * 100}%`,
                          border: '2px solid #000'
                        }}
                      ></div>
                    );
                  })}
                </>
              )}

              {/* Overlays */}
              {!gameStarted && !gameOver && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 border-8 border-[#00ffff] m-4">
                  <h3 className="text-5xl md:text-6xl font-bold text-[#ff00ff] mb-4 glitch-text" data-text="AWAITING_INPUT...">AWAITING_INPUT...</h3>
                  <p className="text-[#00ffff] text-3xl text-center px-8 mb-8">
                    INPUT: [W][A][S][D] OR [ARROWS]<br/>
                    INTERRUPT: [SPACE]
                  </p>
                  <button 
                    onClick={() => setGameStarted(true)}
                    className="px-8 py-2 bg-[#00ffff] text-black text-4xl font-bold hover:bg-[#ff00ff] hover:text-[#00ffff] transition-none border-4 border-transparent hover:border-[#00ffff]"
                  >
                    [ EXECUTE ]
                  </button>
                </div>
              )}

              {isPaused && gameStarted && !gameOver && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 border-8 border-[#ff00ff] m-4">
                  <h3 className="text-6xl md:text-7xl font-bold text-[#00ffff] glitch-text" data-text="SYSTEM_HALT">SYSTEM_HALT</h3>
                  <p className="text-[#ff00ff] text-3xl mt-4">PRESS [SPACE] TO RESUME</p>
                </div>
              )}

              {gameOver && (
                <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-30 border-8 border-[#ff00ff] m-4">
                  <h3 className="text-6xl md:text-7xl font-bold text-[#ff00ff] mb-2 glitch-text" data-text="CRITICAL_ERROR">CRITICAL_ERROR</h3>
                  <h4 className="text-4xl text-[#ff00ff] mb-8">ENTITY TERMINATED</h4>
                  
                  <div className="mb-10 jarring-box p-4 bg-black">
                    <div 
                      className="text-6xl text-[#00ffff]" 
                    >
                      FINAL_METRIC: {score}
                    </div>
                  </div>
                  
                  <button 
                    onClick={resetGame}
                    className="px-8 py-2 bg-[#ff00ff] text-black text-4xl font-bold hover:bg-[#00ffff] hover:text-[#ff00ff] transition-none border-4 border-transparent hover:border-[#ff00ff]"
                  >
                    [ REINITIALIZE ]
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer controls hint */}
      <div className="absolute bottom-4 text-[#ff00ff] text-2xl text-center w-full bg-black py-2 border-y-4 border-[#00ffff]">
        SYS_MSG: MULTITASKING_ENABLED // AUDIO + GRID_RUNNER
      </div>
    </div>
  );
}
