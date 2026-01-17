import { Button } from "@/components/ui/button";
import { Download, Star } from "lucide-react";

const DownloadCTA = () => {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-primary via-primary to-tz-blue relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-secondary fill-secondary" />
            ))}
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Simplify Your Tax Life?
          </h2>

          <p className="text-lg text-primary-foreground/90 mb-10">
            Join thousands of Tanzanians who trust KodiKomply for their tax compliance needs. 
            Download now and take control of your taxes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="gap-2 text-lg px-10 py-6 font-semibold shadow-lg hover:shadow-xl transition-all">
              <a href="/downloads/KodiKomply.apk" download>
                <Download className="w-5 h-5" />
                Download for Android
              </a>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-lg px-10 py-6 font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 opacity-50 cursor-not-allowed" disabled>
              <Download className="w-5 h-5" />
              iOS Coming Soon
            </Button>
          </div>

          <p className="text-primary-foreground/70 text-sm mt-8">
            Free download • No credit card required • Works offline
          </p>
        </div>
      </div>
    </section>
  );
};

export default DownloadCTA;
