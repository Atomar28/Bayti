import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Users, 
  BarChart3, 
  Clock, 
  Shield, 
  Zap,
  Calendar,
  Bot,
  MessageSquare,
  Target,
  ArrowRight,
  CheckCircle,
  Building,
  Home,
  Briefcase,
  TrendingUp
} from "lucide-react";

// Solution Card Component
interface SolutionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  cta: string;
  badge?: string;
}

function SolutionCard({ icon, title, description, features, cta, badge }: SolutionCardProps) {
  return (
    <Card className="relative h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {badge && (
        <Badge className="absolute -top-3 left-4 bg-blue-500">
          {badge}
        </Badge>
      )}
      <CardHeader>
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <Button className="w-full mt-6">
          {cta}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Industry Card Component
interface IndustryCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  useCases: string[];
}

function IndustryCard({ icon, title, description, useCases }: IndustryCardProps) {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {useCases.map((useCase, index) => (
            <li key={index} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
              <span className="text-sm text-gray-600">{useCase}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function Solutions() {
  const coreSolutions = [
    {
      icon: <Phone className="w-6 h-6 text-blue-600" />,
      title: "AI Cold Calling",
      description: "Fully automated outbound calling with human-like conversation capabilities",
      features: [
        "Natural conversation flow with GPT-4o integration",
        "Real-time objection handling",
        "Intelligent call scheduling and timing",
        "Automated follow-up sequences",
        "Custom script upload and management",
        "Multi-language support"
      ],
      cta: "Start Calling",
      badge: "Most Popular"
    },
    {
      icon: <Calendar className="w-6 h-6 text-green-600" />,
      title: "Appointment Booking",
      description: "Smart calendar integration with automatic appointment scheduling",
      features: [
        "Real-time calendar sync",
        "Conflict detection and resolution",
        "Automated reminder systems",
        "Time zone optimization",
        "No-show reduction algorithms",
        "CRM integration"
      ],
      cta: "Book Demo"
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-purple-600" />,
      title: "Analytics & Insights",
      description: "Comprehensive reporting and performance analytics for optimization",
      features: [
        "Real-time call monitoring",
        "Conversion rate tracking",
        "ROI calculation and reporting",
        "A/B testing for scripts",
        "Lead quality scoring",
        "Performance benchmarking"
      ],
      cta: "View Analytics"
    },
    {
      icon: <Bot className="w-6 h-6 text-orange-600" />,
      title: "Campaign Automation",
      description: "End-to-end campaign management with intelligent lead processing",
      features: [
        "Bulk lead upload and processing",
        "Smart dialing algorithms",
        "Automatic lead qualification",
        "Dynamic script personalization",
        "Compliance monitoring",
        "Queue management"
      ],
      cta: "Launch Campaign"
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-teal-600" />,
      title: "Voice Intelligence",
      description: "Advanced voice synthesis and recognition powered by ElevenLabs",
      features: [
        "Hyper-realistic voice generation",
        "Emotion and tone adaptation",
        "Real-time speech analysis",
        "Custom voice training",
        "Accent and language optimization",
        "Voice cloning capabilities"
      ],
      cta: "Try Voices"
    },
    {
      icon: <Shield className="w-6 h-6 text-red-600" />,
      title: "Compliance Suite",
      description: "Built-in compliance tools for GDPR, TCPA, and regional regulations",
      features: [
        "Automatic opt-out handling",
        "Do-not-call list management",
        "Call recording consent",
        "Data protection compliance",
        "Audit trail maintenance",
        "Regulatory reporting"
      ],
      cta: "Learn More"
    }
  ];

  const industries = [
    {
      icon: <Home className="w-6 h-6 text-blue-600" />,
      title: "Real Estate",
      description: "Purpose-built for real estate professionals with specialized lead qualification",
      useCases: [
        "Property lead qualification",
        "Open house invitations",
        "Market update calls",
        "Listing appointment booking",
        "Buyer/seller follow-ups"
      ]
    },
    {
      icon: <Briefcase className="w-6 h-6 text-green-600" />,
      title: "B2B Sales",
      description: "Enterprise-grade solution for complex B2B sales processes",
      useCases: [
        "Lead qualification and scoring",
        "Demo appointment setting",
        "Follow-up call automation",
        "Decision maker identification",
        "Pipeline acceleration"
      ]
    },
    {
      icon: <Building className="w-6 h-6 text-purple-600" />,
      title: "Financial Services",
      description: "Compliant calling solutions for financial institutions and advisors",
      useCases: [
        "Investment consultation booking",
        "Insurance lead qualification",
        "Mortgage pre-qualification",
        "Client check-ins",
        "Regulatory compliance calls"
      ]
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-orange-600" />,
      title: "SaaS & Technology",
      description: "Specialized outreach for software companies and tech startups",
      useCases: [
        "Product demo scheduling",
        "Trial conversion calls",
        "Feature adoption outreach",
        "Churn prevention calls",
        "Upselling campaigns"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-700">AI-Powered Solutions</Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Complete AI calling platform for modern sales teams
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            From cold calling to appointment booking, Bayti provides everything you need 
            to scale your outbound operations with humanlike AI that never sleeps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Core Solutions Grid */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to scale outbound
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform combines AI calling, automation, and analytics 
              to deliver results that scale with your business.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreSolutions.map((solution, index) => (
              <SolutionCard
                key={index}
                icon={solution.icon}
                title={solution.title}
                description={solution.description}
                features={solution.features}
                cta={solution.cta}
                badge={solution.badge}
              />
            ))}
          </div>
        </div>

        {/* Platform Benefits */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why teams choose Bayti
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">24/7 Operation</h3>
                    <p className="text-gray-600">Never miss an opportunity with round-the-clock calling</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Instant Scale</h3>
                    <p className="text-gray-600">Go from 10 to 10,000 calls without hiring more staff</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Precision Targeting</h3>
                    <p className="text-gray-600">AI-driven lead qualification and personalization</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Built-in Compliance</h3>
                    <p className="text-gray-600">Stay compliant with automatic regulatory adherence</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h3 className="font-semibold text-lg mb-4">Platform Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">3.2x</div>
                  <div className="text-sm text-gray-600">ROI Average</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">85%</div>
                  <div className="text-sm text-gray-600">Connect Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">24/7</div>
                  <div className="text-sm text-gray-600">Operation</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Industry Solutions */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built for your industry
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Bayti adapts to the unique needs of different industries with 
              specialized workflows and compliance requirements.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {industries.map((industry, index) => (
              <IndustryCard
                key={index}
                icon={industry.icon}
                title={industry.title}
                description={industry.description}
                useCases={industry.useCases}
              />
            ))}
          </div>
        </div>

        {/* Integration Ecosystem */}
        <div className="bg-gray-900 text-white rounded-2xl p-8 md:p-12 mb-20">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              Integrates with your existing stack
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Seamlessly connect Bayti with your CRM, calendar, and other business tools 
              for a unified workflow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">CRM Integration</h3>
              <p className="text-gray-300">Salesforce, HubSpot, Pipedrive, and more</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Calendar Sync</h3>
              <p className="text-gray-300">Google Calendar, Outlook, Calendly</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Automation</h3>
              <p className="text-gray-300">Zapier, Make, custom webhooks</p>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-4">
            Ready to transform your outbound sales?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join hundreds of sales teams already using Bayti to scale their outbound operations 
            and drive predictable revenue growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Schedule Demo
            </Button>
          </div>
          <p className="text-sm mt-4 opacity-75">
            No credit card required • 14-day free trial • Setup in 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
}