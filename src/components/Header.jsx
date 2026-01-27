import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from '@clerk/clerk-react';
import { AiOutlineMenu, AiOutlineClose } from 'react-icons/ai';

const navLinks = [
  { path: '/upload', label: 'Upload' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/dashboard', label: 'Dashboard' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const location = useLocation();

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-gray-950 border-b border-neon-cyan/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center gap-3 min-w-[40px]" aria-label="Aimalyze Home" onClick={closeMenu}>
          <img
            src="/logo.png"
            alt="Aimalyze logo: AI brain with eye"
            className="h-10 w-auto object-contain select-none"
            style={{ maxWidth: '48px' }}
            loading="eager"
            draggable="false"
          />
          <span className="hidden sm:inline text-2xl font-bold tracking-tight bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-purple bg-clip-text text-transparent">Aimalyze</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative font-medium text-gray-300 hover:text-neon-cyan transition-colors duration-200 px-1 py-0.5 ${location.pathname === link.path ? 'text-neon-cyan' : ''}`}
              onClick={closeMenu}
            >
              {link.label}
              <span className="absolute left-0 -bottom-0.5 w-0 h-0.5 bg-gradient-to-r from-neon-cyan to-neon-pink group-hover:w-full transition-all duration-300"></span>
            </Link>
          ))}
          <SignedIn>
            <div className="pl-6 border-l border-neon-cyan/30">
              <UserButton
                appearance={{
                  elements: {
                    rootBox: 'w-10 h-10',
                    avatarBox: 'w-10 h-10 rounded-full border-2 border-neon-cyan/50 hover:border-neon-cyan transition-all',
                  },
                }}
              />
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <button className="ml-4 px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-pink text-gray-950 font-bold rounded-lg shadow hover:scale-105 transition-all duration-200">Sign in</button>
            </SignInButton>
          </SignedOut>
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-neon-cyan hover:text-neon-pink transition-colors p-2 rounded-lg hover:bg-gray-900/50"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <AiOutlineClose size={28} /> : <AiOutlineMenu size={28} />}
        </button>
      </div>

      {/* Mobile Slide-in Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-gray-950 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ boxShadow: menuOpen ? '0 0 40px 0 rgba(0,255,198,0.15)' : 'none' }}
      >
        <div className="flex flex-col h-full p-6 gap-8">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
              <img
                src="/logo.png"
                alt="Aimalyze logo: AI brain with eye"
                className="h-8 w-auto object-contain select-none"
                style={{ maxWidth: '40px' }}
                loading="eager"
                draggable="false"
              />
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-purple bg-clip-text text-transparent">Aimalyze</span>
            </Link>
            <button onClick={closeMenu} className="text-neon-cyan hover:text-neon-pink p-2 ml-2">
              <AiOutlineClose size={24} />
            </button>
          </div>
          <nav className="flex flex-col gap-6">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium text-lg text-gray-300 hover:text-neon-cyan transition-colors duration-200 px-1 py-0.5 ${location.pathname === link.path ? 'text-neon-cyan' : ''}`}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto">
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    rootBox: 'w-10 h-10',
                    avatarBox: 'w-10 h-10 rounded-full border-2 border-neon-cyan/50 hover:border-neon-cyan transition-all',
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-pink text-gray-950 font-bold rounded-lg shadow hover:scale-105 transition-all duration-200">Sign in</button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
      {/* Overlay for mobile menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={closeMenu}
          aria-label="Close menu overlay"
        />
      )}
    </header>
  );
}
