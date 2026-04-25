import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, User, LogOut } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { localStorage.removeItem('user'); }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    toast({ title: 'Logout realizado', description: 'Você saiu do sistema com sucesso.', duration: 3000 });
    navigate('/');
  };

  const navLink = 'text-foreground/70 hover:text-primary transition-colors text-sm font-medium';

  return (
    <nav className="bg-background border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container-custom py-3">
        <div className="flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <img src="/lovable-uploads/00c3510e-28c5-45a4-9b59-cfd3d101068d.png" alt="ITEC Logo" className="h-9 w-auto" />
            <span className="font-merriweather font-bold text-foreground text-lg hidden sm:block">
              ITEC
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-5 flex-1">
            <Link to="/cursos" className={navLink}>Cursos</Link>
            <Link to="/professores" className={navLink}>Professores</Link>
            <div className="relative group">
              <button className={`flex items-center ${navLink}`}>
                Sobre <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-popover border border-border shadow-lg rounded-md overflow-hidden scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all origin-top">
                <Link to="/sobre"    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent">Nossa Missão</Link>
                <Link to="/docentes" className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent">Corpo Docente</Link>
                <Link to="/contato"  className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent">Contato</Link>
              </div>
            </div>
            <Link to="/comunidade" className={navLink}>Comunidade</Link>
            <Link to="/blog"       className={navLink}>Blog</Link>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeSwitcher />
            {user ? (
              <>
                <span className="flex items-center text-sm text-foreground/70">
                  <User className="mr-1 h-4 w-4 text-primary" />{user.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout} className="border-border text-foreground/70 hover:text-primary">
                  <LogOut className="mr-1 h-4 w-4" /> Sair
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/80 text-primary-foreground" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              </>
            ) : (
              <Button size="sm" className="bg-primary hover:bg-primary/80 text-primary-foreground font-semibold" asChild>
                <Link to="/login"><User className="mr-2 h-4 w-4" /> Entrar</Link>
              </Button>
            )}
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeSwitcher />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-foreground">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pb-3 border-t border-border">
            <div className="flex flex-col space-y-3 mt-3">
              <Link to="/cursos"     className={navLink} onClick={() => setMobileMenuOpen(false)}>Cursos</Link>
              <Link to="/sobre"      className={navLink} onClick={() => setMobileMenuOpen(false)}>Nossa Missão</Link>
              <Link to="/docentes"   className={navLink} onClick={() => setMobileMenuOpen(false)}>Corpo Docente</Link>
              <Link to="/contato"    className={navLink} onClick={() => setMobileMenuOpen(false)}>Contato</Link>
              <Link to="/comunidade" className={navLink} onClick={() => setMobileMenuOpen(false)}>Comunidade</Link>
              <Link to="/blog"       className={navLink} onClick={() => setMobileMenuOpen(false)}>Blog</Link>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                {user ? (
                  <>
                    <Button variant="outline" className="flex-1 border-border" onClick={handleLogout}>
                      <LogOut className="mr-1 h-4 w-4" /> Sair
                    </Button>
                    <Button className="flex-1 bg-primary text-primary-foreground" asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                  </>
                ) : (
                  <Button className="w-full bg-primary text-primary-foreground font-semibold" asChild>
                    <Link to="/login"><User className="mr-2 h-4 w-4" /> Entrar</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
