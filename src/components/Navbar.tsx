
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, User } from 'lucide-react';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full bg-itec-blue flex items-center justify-center">
              <span className="text-white font-merriweather font-bold text-xl">I</span>
            </div>
            <span className="font-merriweather font-bold text-itec-blue text-xl hidden sm:block">ITEC EAD</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/cursos" className="text-itec-darkGray hover:text-itec-blue transition-colors">Cursos</Link>
            <div className="relative group">
              <button className="flex items-center text-itec-darkGray hover:text-itec-blue transition-colors">
                Sobre <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden transform scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all origin-top">
                <Link to="/sobre" className="block px-4 py-2 hover:bg-itec-lightGray">Nossa Missão</Link>
                <Link to="/docentes" className="block px-4 py-2 hover:bg-itec-lightGray">Corpo Docente</Link>
                <Link to="/contato" className="block px-4 py-2 hover:bg-itec-lightGray">Contato</Link>
              </div>
            </div>
            <Link to="/comunidade" className="text-itec-darkGray hover:text-itec-blue transition-colors">Comunidade</Link>
            <Link to="/blog" className="text-itec-darkGray hover:text-itec-blue transition-colors">Blog</Link>
          </div>

          {/* Login/Register Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link to="/login" className="flex items-center text-itec-blue hover:text-opacity-80 transition-colors">
              <User className="mr-1 h-4 w-4" /> Entrar
            </Link>
            <Button className="btn-primary">Matricule-se</Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-itec-darkGray">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pb-3 border-t border-gray-200">
            <div className="flex flex-col space-y-3 mt-3">
              <Link to="/cursos" className="text-itec-darkGray hover:text-itec-blue transition-colors">Cursos</Link>
              <Link to="/sobre" className="text-itec-darkGray hover:text-itec-blue transition-colors">Nossa Missão</Link>
              <Link to="/docentes" className="text-itec-darkGray hover:text-itec-blue transition-colors">Corpo Docente</Link>
              <Link to="/contato" className="text-itec-darkGray hover:text-itec-blue transition-colors">Contato</Link>
              <Link to="/comunidade" className="text-itec-darkGray hover:text-itec-blue transition-colors">Comunidade</Link>
              <Link to="/blog" className="text-itec-darkGray hover:text-itec-blue transition-colors">Blog</Link>
              <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-gray-200">
                <Link to="/login" className="flex-1">
                  <Button variant="outline" className="w-full">Entrar</Button>
                </Link>
                <Link to="/registro" className="flex-1">
                  <Button className="btn-primary w-full">Matricule-se</Button>
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
