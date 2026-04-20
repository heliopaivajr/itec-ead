
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-itec-lightGray">
      <div className="text-center p-8">
        <h1 className="font-merriweather font-bold text-6xl text-itec-blue mb-4">404</h1>
        <p className="text-xl text-itec-darkGray mb-6">Página não encontrada</p>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          A página que você está procurando pode ter sido removida, renomeada ou está temporariamente indisponível.
        </p>
        <Button asChild className="btn-primary">
          <Link to="/">Voltar ao Início</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
