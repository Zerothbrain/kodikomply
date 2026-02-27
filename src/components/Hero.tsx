import { Button } from "@/components/ui/button";
import { Download, Shield, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-tz-blue py-20 lg:py-28">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Shield className="w-4 h-4 text-secondary" />
              <span className="text-primary-foreground text-sm font-medium">
                Trusted by 10,000+ Tanzanians
              </span>
            </motion.div>

            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              Tax Compliance
              <span className="block text-secondary">Made Simple</span>
            </motion.h1>

            <motion.p
              className="text-lg text-primary-foreground/90 mb-8 max-w-xl mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              KodiKomply helps you stay compliant with TRA regulations. Track deadlines, 
              calculate taxes, and file returns — all from your phone.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <Button asChild size="lg" variant="secondary" className="gap-2 text-lg px-8 py-6 font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <a href="/downloads/KodiKomply.apk" download>
                  <Download className="w-5 h-5" />
                  Download App
                </a>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-6 font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:scale-105 transition-all duration-300">
                Learn More
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              className="flex flex-wrap gap-6 mt-10 justify-center lg:justify-start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              {["TRA Compliant", "Secure & Private", "Free to Use"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-primary-foreground/80">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Floating Logo */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-secondary/20 rounded-full blur-3xl scale-110" />
              <motion.img
                src={logo}
                alt="KodiKomply Tanzania"
                className="relative w-72 md:w-80 lg:w-96 drop-shadow-2xl"
                initial={{ y: -20, rotate: -2, opacity: 0 }}
                animate={{ y: [0, -12, 0], rotate: [0, 2, 0], opacity: 1 }}
                transition={{
                  opacity: { duration: 0.8 },
                  y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
