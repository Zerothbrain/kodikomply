import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="KodiKomply" className="w-12 h-12" />
            <div>
              <span className="text-background font-bold text-lg">KodiKomply</span>
              <span className="block text-muted-foreground text-xs">Tanzania</span>
            </div>
          </div>

          <nav className="flex flex-wrap gap-6 justify-center">
            <a href="#" className="text-muted-foreground hover:text-background transition-colors text-sm">
              About
            </a>
            <a href="#" className="text-muted-foreground hover:text-background transition-colors text-sm">
              Features
            </a>
            <a href="#" className="text-muted-foreground hover:text-background transition-colors text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-muted-foreground hover:text-background transition-colors text-sm">
              Terms of Service
            </a>
            <a href="#" className="text-muted-foreground hover:text-background transition-colors text-sm">
              Contact
            </a>
          </nav>
        </div>

        <div className="border-t border-muted/20 mt-8 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} KodiKomply Tanzania. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
