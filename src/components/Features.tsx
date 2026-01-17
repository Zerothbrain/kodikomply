import { Calendar, Calculator, Bell, FileText, Shield, Clock } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Tax Calendar",
    description: "Never miss a deadline with smart reminders for all your tax obligations.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Calculator,
    title: "Tax Calculator",
    description: "Instantly calculate PAYE, VAT, and other taxes with our built-in tools.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Get notified before deadlines approach so you're always prepared.",
    color: "bg-secondary/10 text-tz-black",
  },
  {
    icon: FileText,
    title: "Easy Filing",
    description: "Step-by-step guidance for filing your tax returns correctly.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Shield,
    title: "TRA Compliant",
    description: "Aligned with Tanzania Revenue Authority regulations and requirements.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Reduce hours of manual work to just minutes with automation.",
    color: "bg-secondary/10 text-tz-black",
  },
];

const Features = () => {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
            Everything You Need for Tax Compliance
          </h2>
          <p className="text-muted-foreground text-lg">
            KodiKomply brings all the tools you need to stay compliant in one simple app.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 lg:p-8 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-card-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
