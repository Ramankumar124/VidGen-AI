export default function Header() {
    return (
        <header className="header">
            <div className="logo">
                <div className="logo-icon">
                    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="20" fill="url(#hgrad)" />
                        <polygon points="15,12 15,28 30,20" fill="white" />
                        <defs>
                            <linearGradient id="hgrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#7C3AED" />
                                <stop offset="1" stopColor="#06B6D4" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <span>VidGen <span className="logo-ai">AI</span></span>
            </div>

            <nav className="nav-pills">
                <a href="#" className="nav-pill active">Studio</a>
                <a href="#" className="nav-pill">History</a>
                <a href="#" className="nav-pill">Docs</a>
            </nav>

            <div className="header-badge">
                <span className="badge-dot" />
                <span>AI Ready</span>
            </div>
        </header>
    )
}
