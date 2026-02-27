import { Download, UserCheck, Smartphone } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    icon: Download,
    title: "Download the App",
    description: "Get KodiKomply free from your app store and install it on your device.",
  },
  {
    step: "02",
    icon: UserCheck,
    title: "Create Your Profile",
    description: "Set up your business or personal tax profile in just a few taps.",
  },
  {
    step: "03",
    icon: Smartphone,
    title: "Stay Compliant",
    description: "Receive reminders, calculate taxes, and file returns easily.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 lg:py-28 bg-muted relative z-10">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
            Get Started in 3 Simple Steps
          </h2>
          <p className="text-muted-foreground text-lg">
            Begin your journey to stress-free tax compliance today.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              className="relative text-center"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: index * 0.2 }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
              )}

              <div className="relative inline-flex mb-6">
                <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center shadow-lg border-4 border-primary/20">
                  <item.icon className="w-12 h-12 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 w-10 h-10 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                  {item.step}
                </span>
              </div>

              <h3 className="text-xl font-bold text-foreground mb-3">
                {item.title}
              </h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
