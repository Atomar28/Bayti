import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Check, 
  X, 
  Phone, 
  Zap, 
  Shield, 
  Lock,
  Calculator,
  ArrowRight
} from "lucide-react";

// Cost Estimator Component
function CostEstimator() {
  const [calls, setCalls] = useState(1000);
  const [premiumVoices, setPremiumVoices] = useState(false);
  const [priorityRouting, setPriorityRouting] = useState(false);

  const calculateManagedCost = () => {
    let baseRate = 0.30;
    if (calls >= 5000) baseRate = 0.28;
    if (calls >= 20000) baseRate = 0.25;
    
    let cost = calls * baseRate;
    if (premiumVoices) cost += calls * 0.05;
    if (priorityRouting) cost += calls * 0.02;
    
    return cost;
  };

  const calculateAPICost = () => {
    let baseRate = 0.30;
    if (calls >= 1000) baseRate = 0.25;
    if (calls >= 10000) baseRate = 0.22;
    
    let cost = calls * baseRate;
    if (premiumVoices) cost += calls * 0.05;
    
    return cost;
  };

  const managedCost = calculateManagedCost();
  const apiCost = calculateAPICost();
  const showEnterpriseHint = calls > 5000;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Cost Estimator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="calls">Monthly Calls</Label>
          <input
            id="calls"
            type="number"
            value={calls}
            onChange={(e) => setCalls(Number(e.target.value))}
            className="w-full p-2 mt-1 border rounded-md"
            min="100"
            max="100000"
            step="100"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="premium-voices" 
            checked={premiumVoices}
            onCheckedChange={setPremiumVoices}
          />
          <Label htmlFor="premium-voices">Premium Voices (+$0.05/call)</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="priority-routing" 
            checked={priorityRouting}
            onCheckedChange={setPriorityRouting}
          />
          <Label htmlFor="priority-routing">Priority Routing (+$0.02/call)</Label>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between">
            <span className="text-sm">Managed Service:</span>
            <span className="font-semibold">${managedCost.toFixed(0)}/mo</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">API Usage:</span>
            <span className="font-semibold">${apiCost.toFixed(0)}/mo</span>
          </div>
          {showEnterpriseHint && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              💡 Enterprise might be cheaper at this volume
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Pricing Card Component
interface PricingCardProps {
  title: string;
  price: string;
  description: string;
  features: Array<{ name: string; included: boolean }>;
  cta: string;
  popular?: boolean;
  isAnnual?: boolean;
}

function PricingCard({ title, price, description, features, cta, popular, isAnnual }: PricingCardProps) {
  const annualDiscount = isAnnual ? 0.9 : 1; // 10% discount for annual
  const displayPrice = isAnnual ? (parseInt(price.replace('$', '').replace(',', '')) * annualDiscount).toFixed(0) : price.replace('$', '');
  
  return (
    <Card className={`relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
      {popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
          Most Popular
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">${displayPrice}</span>
          <span className="text-gray-600">/mo</span>
          {isAnnual && (
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
              2 months free
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              {feature.included ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <X className="w-4 h-4 text-gray-400" />
              )}
              <span className={feature.included ? "text-gray-900" : "text-gray-500"}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
        <Button className="w-full" variant={popular ? "default" : "outline"}>
          {cta}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeTab, setActiveTab] = useState("enterprise");

  const enterpriseFeatures = [
    { name: "Automatic AI cold calling (campaign uploads)", included: true },
    { name: "Manual call mode", included: true },
    { name: "Automatic callbacks & rescheduling", included: true },
    { name: "Appointment booking tool", included: true },
    { name: "Real-time dashboard & analytics", included: true },
    { name: "API access", included: true },
  ];

  const managedFeatures = [
    { name: "Professional AI agent (humanlike)", included: true },
    { name: "Campaign reporting (summary)", included: true },
    { name: "Compliance & opt-out handling", included: true },
    { name: "Platform access", included: false },
    { name: "Automation, callbacks, dashboard", included: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Sticky Trust Banner */}
      <div className="sticky top-0 z-50 bg-blue-600 text-white text-center py-2 px-4">
        <div className="flex items-center justify-center gap-2 text-sm">
          <Lock className="w-4 h-4" />
          <span className="font-medium">Cheaper than hiring a human, as natural as one — runs 24/7 at scale.</span>
        </div>
        <div className="text-xs opacity-90 mt-1">Founders' Launch Pricing—limited time.</div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Simple, competitive pricing to scale your outbound
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Bayti is cheaper than hiring a human, but just as natural — and it works 24/7, 
            never takes breaks, and dials at massive scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start a campaign
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline">
              Talk to sales
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            All plans include compliance tools and opt-out handling.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {/* Billing Toggle */}
            <div className="flex justify-center items-center gap-4 mb-8">
              <Label htmlFor="billing-toggle" className={!isAnnual ? "font-semibold" : ""}>
                Monthly
              </Label>
              <Switch 
                id="billing-toggle"
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <Label htmlFor="billing-toggle" className={isAnnual ? "font-semibold" : ""}>
                Annual
                <Badge className="ml-2 bg-green-100 text-green-700">Save 10%</Badge>
              </Label>
            </div>

            {/* Model Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="enterprise">Enterprise SaaS</TabsTrigger>
                <TabsTrigger value="managed">Managed Service</TabsTrigger>
                <TabsTrigger value="api">API</TabsTrigger>
              </TabsList>

              {/* Enterprise SaaS Tab */}
              <TabsContent value="enterprise" className="space-y-8">
                <div className="text-center mb-8">
                  <p className="text-lg text-gray-600">
                    Full platform access with automation, dashboards, and integrations.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <PricingCard
                    title="Pro"
                    price="$750"
                    description="5 seats • 5,000 calls/mo threshold • $0.05/call overage"
                    features={enterpriseFeatures}
                    cta="Start Free Pilot"
                    isAnnual={isAnnual}
                  />
                  <PricingCard
                    title="Growth"
                    price="$1,950"
                    description="15 seats • 20,000 calls/mo threshold • $0.05/call overage"
                    features={enterpriseFeatures}
                    cta="Start Free Pilot"
                    popular={true}
                    isAnnual={isAnnual}
                  />
                  <PricingCard
                    title="Scale"
                    price="$5,500"
                    description="50 seats • 70,000 calls/mo threshold • $0.05/call overage"
                    features={enterpriseFeatures}
                    cta="Talk to Sales"
                    isAnnual={isAnnual}
                  />
                </div>

                {/* Add-ons */}
                <div className="bg-gray-50 rounded-2xl p-6 mt-8">
                  <h3 className="font-semibold text-lg mb-4">Add-ons</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span>Premium voices</span>
                      <span className="font-medium">+$0.05/min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Priority call routing</span>
                      <span className="font-medium">+15% on base</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI appointment optimization</span>
                      <span className="font-medium">+$200/mo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Lead scraping</span>
                      <Badge className="bg-amber-100 text-amber-700">COMING SOON</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Managed Service Tab */}
              <TabsContent value="managed" className="space-y-8">
                <div className="text-center mb-8">
                  <p className="text-lg text-gray-600">
                    We run the calling for you. You get results. No platform access.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle>Starter</CardTitle>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">$300</span>
                        <span className="text-gray-600">/ 1,000 calls</span>
                      </div>
                      <CardDescription>$0.30 per call</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {managedFeatures.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            {feature.included ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-gray-400" />
                            )}
                            <span className={feature.included ? "text-gray-900" : "text-gray-500"}>
                              {feature.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full" variant="outline">
                        Book Managed Campaign
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ring-2 ring-blue-500 scale-105">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                      Best Value
                    </Badge>
                    <CardHeader>
                      <CardTitle>Growth</CardTitle>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">$1,400</span>
                        <span className="text-gray-600">/ 5,000 calls</span>
                      </div>
                      <CardDescription>$0.28 per call</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {managedFeatures.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            {feature.included ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-gray-400" />
                            )}
                            <span className={feature.included ? "text-gray-900" : "text-gray-500"}>
                              {feature.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full">
                        Book Managed Campaign
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle>Scale</CardTitle>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">$5,000</span>
                        <span className="text-gray-600">/ 20,000 calls</span>
                      </div>
                      <CardDescription>$0.25 per call</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {managedFeatures.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            {feature.included ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <X className="w-4 h-4 text-gray-400" />
                            )}
                            <span className={feature.included ? "text-gray-900" : "text-gray-500"}>
                              {feature.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full" variant="outline">
                        Book Managed Campaign
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Managed Add-ons */}
                <div className="bg-gray-50 rounded-2xl p-6 mt-8">
                  <h3 className="font-semibold text-lg mb-4">Add-ons (per call unless noted)</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span>Premium voices</span>
                      <span className="font-medium">+$0.05/call</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Priority routing</span>
                      <span className="font-medium">+$0.02/call</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rush campaign</span>
                      <span className="font-medium">+$50 flat</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Lead scraping</span>
                      <Badge className="bg-amber-100 text-amber-700">COMING SOON</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* API Tab */}
              <TabsContent value="api" className="space-y-8">
                <div className="text-center mb-8">
                  <p className="text-lg text-gray-600">
                    Plug our AI calling, booking, and (soon) lead gen into your stack.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle>Small</CardTitle>
                      <CardDescription>&lt;1,000 calls/mo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">$0.30</div>
                        <div className="text-gray-600">per call</div>
                      </div>
                      <Button className="w-full" variant="outline">
                        Get API Key
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ring-2 ring-blue-500 scale-105">
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                      Most Popular
                    </Badge>
                    <CardHeader>
                      <CardTitle>Volume</CardTitle>
                      <CardDescription>1,000–10,000 calls/mo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">$0.25</div>
                        <div className="text-gray-600">per call</div>
                      </div>
                      <Button className="w-full">
                        Get API Key
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <CardHeader>
                      <CardTitle>Enterprise</CardTitle>
                      <CardDescription>10,000+ calls/mo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold">$0.22</div>
                        <div className="text-gray-600">per call</div>
                      </div>
                      <Button className="w-full" variant="outline">
                        Contact Sales
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* API Additional Services */}
                <div className="bg-gray-50 rounded-2xl p-6 mt-8">
                  <h3 className="font-semibold text-lg mb-4">Additional API Services</h3>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex justify-between">
                      <span>Appointment booking API</span>
                      <span className="font-medium">$0.10 per booking</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Lead scraping API</span>
                      <Badge className="bg-amber-100 text-amber-700">COMING SOON</Badge>
                    </div>
                  </div>
                  <h4 className="font-medium mb-2">Add-ons</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span>Premium voices</span>
                      <span className="font-medium">+$0.05/min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dedicated throughput</span>
                      <span className="font-medium">+$99/mo</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Cost Estimator Sidebar */}
          <div className="lg:col-span-1">
            <CostEstimator />
          </div>
        </div>

        {/* Value Props */}
        <div className="grid md:grid-cols-3 gap-8 mt-16 mb-16">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Humanlike by design</h3>
            <p className="text-gray-600">Neural TTS + SSML + smart pacing</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Fast at scale</h3>
            <p className="text-gray-600">Auto-queueing, concurrency, business-hour controls</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Compliance-first</h3>
            <p className="text-gray-600">Opt-out, suppression, audit logs</p>
          </div>
        </div>

        {/* Price Confidence */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 mb-16">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Priced to beat human callers
            </h2>
            <p className="text-lg text-gray-600">
              Typical pro callers charge ~$0.37–$0.38 per call in Dubai. Bayti gives you 
              humanlike quality, automation, and analytics — from $0.25 per call at scale.
            </p>
          </div>
        </div>

        {/* Add-ons Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Premium Add-ons</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Premium voices</CardTitle>
                <div className="text-2xl font-bold text-blue-600">+$0.05/min</div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Hyper-realistic voices for premium campaigns.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Priority routing</CardTitle>
                <div className="text-2xl font-bold text-green-600">+15% base</div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Lower wait times for time-sensitive pushes.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">AI optimization</CardTitle>
                <div className="text-2xl font-bold text-purple-600">+$200/mo</div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Smarter follow-ups to increase booked meetings.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-lg">Lead scraping</CardTitle>
                <Badge className="bg-amber-100 text-amber-700">COMING SOON</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Auto-fill your funnel with targeted leads.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What counts as a call?</AccordionTrigger>
              <AccordionContent>
                A completed outbound attempt initiated by Bayti's dialer.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Do you charge for failed/out-of-service numbers?</AccordionTrigger>
              <AccordionContent>
                Optional: exclude unreachable numbers (configurable).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>What about international rates?</AccordionTrigger>
              <AccordionContent>
                Pricing above assumes UAE; contact sales for other regions.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Can I switch plans later?</AccordionTrigger>
              <AccordionContent>
                Yes, upgrade/downgrade anytime; prorated.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Do you offer pilots?</AccordionTrigger>
              <AccordionContent>
                Yes—ask sales for a 7-day pilot on Enterprise or a 500-call trial on Managed Service.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Do you integrate with my CRM?</AccordionTrigger>
              <AccordionContent>
                Enterprise SaaS includes CRM integrations; API also available.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Trust Elements */}
        <div className="flex justify-center items-center gap-6 text-sm text-gray-500 mb-8">
          <div className="flex items-center gap-1">
            <Lock className="w-4 h-4" />
            <span>GDPR-ready</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span>Opt-out compliant</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span>99.9% uptime</span>
          </div>
        </div>

        {/* CTA Footer */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-8">
          <h2 className="text-3xl font-bold mb-4">Ready to outcall the competition?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Start a campaign
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Talk to sales
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-4 right-4 lg:hidden">
        <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg">
          Talk to Sales
        </Button>
      </div>
    </div>
  );
}