
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, User } from 'lucide-react';
import { useThemeMode } from '@/hooks/use-theme-mode';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useThemeMode();
  const isDark = theme === 'dark';

  return (
    <nav className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm border-b sticky top-0 z-50`}>
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/00c3510e-28c5-45a4-9b59-cfd3d101068d.png" 
              alt="ITEC Logo" 
              className="h-10 w-auto"
            />
            <span className={`font-merriweather font-bold ${isDark ? 'text-white' : 'text-itec-blue'} text-xl hidden sm:block`}>
              ITEC {isDark && <span className="text-itec-bloodRed">EAD</span>}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/cursos" className={`${isDark ? 'text-gray-300 hover:text-itec-bloodRed' : 'text-itec-darkGray hover:text-itec-blue'} transition-colors`}>Cursos</Link>
            <div className="relative group">
              <button className={`flex items-center ${isDark ? 'text-gray-300 hover:text-itec-bloodRed' : 'text-itec-darkGray hover:text-itec-blue'} transition-colors`}>
                Sobre <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className={`absolute left-0 mt-2 w-48 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg rounded-md overflow-hidden transform scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all origin-top`}>
                <Link to="/sobre" className={`block px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-itec-lightGray'}`}>Nossa Missão</Link>
                <Link to="/docentes" className={`block px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-itec-lightGray'}`}>Corpo Docente</Link>
                <Link to="/contato" className={`block px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-itec-lightGray'}`}>Contato</Link>
              </div>
            </div>
            <Link to="/comunidade" className={`${isDark ? 'text-gray-300 hover:text-itec-bloodRed' : 'text-itec-darkGray hover:text-itec-blue'} transition-colors`}>Comunidade</Link>
            <Link to="/blog" className={`${isDark ? 'text-gray-300 hover:text-itec-bloodRed' : 'text-itec-darkGray hover:text-itec-blue'} transition-colors`}>Blog</Link>
          </div>

          {/* Login/Register Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to="/login" className={`flex items-center ${isDark ? 'text-gray-300 hover:text-itec-bloodRed' : 'text-itec-blue hover:text-opacity-80'} transition-colors`}>
              <User className="mr-1 h-4 w-4" /> Entrar
            </Link>
            <Button className={isDark ? "bg-itec-bloodRed hover:bg-itec-bloodRed/80 text-white" : "btn-primary"} asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={isDark ? "text-gray-300" : "text-itec-darkGray"}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pb-3 border-t border-gray-700">
            <div className="flex flex-col space-y-3 mt-3">
              <Link to="/cursos" className={`${isDark ? 'text-gray-300 hover:text-itec-bloodRed' : 'text-itec-darkGray hover:text-itec-blue'} transition-colors`}>Cursos</Link>
              <Link to="/sobre" className={`${isDark ? 'text-gray-300 hover:text-itec-bloodRed' : 'text-itec-darkGray hover:text-itec-blue'} transition-colors`}>Nossa Missão</Link>
              <Link to="/docentes" className={`${isDark ? 'text-gray-300 hover:text-itec-bloodRed' : 'text-itec-darkGray hover:text-itec-blue'} transition-colors`}>Corpo Docente</Link>
              <Link to="/contato" className={`${isDark ? 'text-gray-300 hover:text-itec-bloodRed' : 'text-itec-darkGray hover:text-itec-blue'} transition-colors`}>Contato</Link>
              <Link to="/comunidade" className={`${isDark ? 'text-gray-300 hover:text-itec-bloodRed' : 'text-itec-darkGray hover:text-itec-blue'} transition-colors`}>Comunidade</Link>
              <Link to="/blog" className={`${isDark ? 'text-gray-300 hover:text-itec-bloodRed' : 'text-itec-darkGray hover:text-itec-blue'} transition-colors`}>Blog</Link>
              <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-gray-700">
                <Link to="/login" className="flex-1">
                  <Button variant="outline" className={`w-full ${isDark ? 'border-gray-600 text-gray-300' : ''}`}>Entrar</Button>
                </Link>
                <Link to="/dashboard" className="flex-1">
                  <Button className={`w-full ${isDark ? 'bg-itec-bloodRed hover:bg-itec-bloodRed/80 text-white' : 'btn-primary'}`}>Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
