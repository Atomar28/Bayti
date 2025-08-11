import { useState } from "react";
import { Check, X, ArrowRight, Phone, Zap, Shield, Clock, Users, BarChart3, Star } from "lucide-react";

const Pricing = () => {
  const [activeTab, setActiveTab] = useState("enterprise");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [showEstimator, setShowEstimator] = useState(false);
  const [estimatorInputs, setEstimatorInputs] = useState({
    calls: 1000,
    premiumVoices: false,
    priorityRouting: false
  });

  const calculateEstimate = () => {
    let basePrice = 0;
    let perCall = 0;
    
    if (activeTab === "managed") {
      if (estimatorInputs.calls <= 1000) perCall = 0.30;
      else if (estimatorInputs.calls <= 5000) perCall = 0.28;
      else perCall = 0.25;
      basePrice = estimatorInputs.calls * perCall;
    } else if (activeTab === "api") {
      if (estimatorInputs.calls < 1000) perCall = 0.30;
      else if (estimatorInputs.calls <= 10000) perCall = 0.25;
      else perCall = 0.22;
      basePrice = estimatorInputs.calls * perCall;
    }
    
    if (estimatorInputs.premiumVoices) basePrice += estimatorInputs.calls * 0.05;
    if (estimatorInputs.priorityRouting) basePrice += estimatorInputs.calls * 0.02;
    
    return basePrice;
  };

  const ComingSoonBadge = () => (
    <span className="inline-block px-2 py-1 text-xs font-bold text-amber-800 bg-amber-100 rounded-full">
      COMING SOON
    </span>
  );

  const enterprisePlans = [
    {
      name: "Pro",
      price: billingCycle === "monthly" ? 750 : 675,
      seats: 5,
      threshold: 5000,
      overage: 0.05,
      features: ["Automatic AI cold calling", "Manual call mode", "Automatic callbacks", "Appointment booking", "Real-time dashboard", "API access"],
      cta: "Start Free Trial",
      popular: false
    },
    {
      name: "Growth", 
      price: billingCycle === "monthly" ? 1950 : 1755,
      seats: 15,
      threshold: 20000,
      overage: 0.05,
      features: ["Everything in Pro", "Advanced analytics", "Custom scripts", "Priority support", "Team collaboration", "Advanced integrations"],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Scale",
      price: billingCycle === "monthly" ? 5500 : 4950,
      seats: 50,
      threshold: 70000,
      overage: 0.05,
      features: ["Everything in Growth", "White-label solution", "Dedicated account manager", "Custom integrations", "SLA guarantees", "Advanced reporting"],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const managedBundles = [
    { name: "Starter", calls: 1000, price: 300, perCall: 0.30 },
    { name: "Growth", calls: 5000, price: 1400, perCall: 0.28 },
    { name: "Scale", calls: 20000, price: 5000, perCall: 0.25 }
  ];

  const apiTiers = [
    { name: "Small", range: "<1,000 calls/mo", price: 0.30 },
    { name: "Volume", range: "1,000–10,000", price: 0.25 },
    { name: "Enterprise", range: "10,000+", price: 0.22, contact: true }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Trust Banner */}
      <div className="sticky top-0 z-50 bg-blue-600 text-white py-2">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium">
            Cheaper than hiring a human, as natural as one — runs 24/7 at scale.
          </p>
          <p className="text-xs opacity-90">Founders' Launch Pricing — limited time.</p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Simple, competitive pricing to<br />scale your outbound
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Bayti is cheaper than hiring a human, but just as natural — and it works 24/7, 
            never takes breaks, and dials at massive scale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              Start a campaign <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-8 py-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              Talk to sales
            </button>
          </div>
          <p className="text-sm text-gray-500">All plans include compliance tools and opt-out handling.</p>
        </div>
      </section>

      {/* Pricing Tabs */}
      <section className="px-4">
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { id: "enterprise", label: "Enterprise SaaS" },
                { id: "managed", label: "Managed Service" },
                { id: "api", label: "API & Integrations" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-md font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enterprise SaaS Tab */}
          {activeTab === "enterprise" && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-lg text-gray-600 mb-6">
                  Full platform access with automation, dashboards, and integrations.
                </p>
                
                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <span className={billingCycle === "monthly" ? "font-medium" : "text-gray-500"}>Monthly</span>
                  <button
                    onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      billingCycle === "annual" ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        billingCycle === "annual" ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className={billingCycle === "annual" ? "font-medium" : "text-gray-500"}>
                    Annual
                    {billingCycle === "annual" && (
                      <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Save 10%
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {enterprisePlans.map((plan) => (
                  <div
                    key={plan.name}
                    className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                      plan.popular ? "ring-2 ring-blue-600" : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="text-4xl font-bold text-gray-900 mb-1">
                        ${plan.price.toLocaleString()}
                        <span className="text-lg font-normal text-gray-500">/mo</span>
                      </div>
                      <p className="text-gray-600">{plan.seats} seats • {plan.threshold.toLocaleString()} calls/mo</p>
                      <p className="text-sm text-gray-500">Overage: ${plan.overage}/call</p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      plan.popular
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}>
                      {plan.cta}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add-ons for Enterprise */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-lg font-semibold mb-4">Add-ons</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center">
                    <span>Premium voices</span>
                    <span className="text-gray-600">+$0.05/min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Priority call routing</span>
                    <span className="text-gray-600">+15% on base</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>AI appointment optimization</span>
                    <span className="text-gray-600">+$200/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      Lead scraping <ComingSoonBadge />
                    </span>
                    <span className="text-gray-400">TBD</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Managed Service Tab */}
          {activeTab === "managed" && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-lg text-gray-600 mb-8">
                  Done-for-you calling. We run the campaign; you get results. No platform access.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {managedBundles.map((bundle) => (
                  <div key={bundle.name} className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{bundle.name}</h3>
                      <div className="text-4xl font-bold text-gray-900 mb-1">
                        ${bundle.price.toLocaleString()}
                      </div>
                      <p className="text-gray-600">{bundle.calls.toLocaleString()} calls</p>
                      <p className="text-sm text-gray-500">${bundle.perCall}/call</p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>Humanlike AI agent</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>Campaign summary reporting</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        <span>Compliance & opt-out handling</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <X className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-500">Platform access</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <X className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-500">Automation, callbacks, dashboards</span>
                      </li>
                    </ul>

                    <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                      Book Managed Campaign
                    </button>
                  </div>
                ))}
              </div>

              {/* Managed Service Add-ons */}
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Premium voices (+$0.05/call)</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Priority routing (+$0.02/call)</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Rush campaign (+$50 flat)</span>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">Lead scraping — COMING SOON</span>
              </div>
            </div>
          )}

          {/* API & Integrations Tab */}
          {activeTab === "api" && (
            <div className="space-y-8">
              <div className="text-center">
                <p className="text-lg text-gray-600 mb-8">
                  Plug Bayti into your product — calling, booking, and (soon) lead gen.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {apiTiers.map((tier) => (
                  <div key={tier.name} className="bg-white rounded-2xl shadow-lg p-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                      <p className="text-gray-600 mb-4">{tier.range}</p>
                      <div className="text-4xl font-bold text-gray-900">
                        ${tier.price}
                        <span className="text-lg font-normal text-gray-500">/call</span>
                      </div>
                    </div>

                    <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      tier.contact
                        ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}>
                      {tier.contact ? "Contact Sales" : "Get API Key"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Additional Endpoints */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-lg font-semibold mb-4">Additional Endpoints</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Appointment booking API</span>
                    <span className="text-gray-600">$0.10 per booking</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      Lead scraping API <ComingSoonBadge />
                    </span>
                    <span className="text-gray-400">TBD</span>
                  </div>
                </div>
                
                <h5 className="font-medium mt-6 mb-2">Add-ons</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Premium voices</span>
                    <span className="text-gray-600">+$0.05/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dedicated throughput</span>
                    <span className="text-gray-600">+$99/mo</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Humanlike by design</h3>
              <p className="text-gray-600">Neural TTS + SSML + smart pacing for natural conversations</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast at scale</h3>
              <p className="text-gray-600">Auto-queueing, concurrency, business-hour controls</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Compliance-first</h3>
              <p className="text-gray-600">Opt-out, suppression, audit logs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Price Justification */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Priced to beat human callers</h2>
          <p className="text-lg text-gray-600 mb-4">
            Typical professional cold callers in Dubai charge ~ $0.37–$0.38 per call. 
            Bayti delivers humanlike quality plus automation and analytics — from $0.25 per call at scale.
          </p>
          <p className="text-sm text-gray-500">*International rates may vary</p>
        </div>
      </section>

      {/* Add-ons Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Enhance your campaigns</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Premium voices</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">Hyper-realistic voices for premium campaigns.</p>
              <span className="text-blue-600 font-medium">+$0.05/min</span>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Priority routing</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">Lower wait times for time-sensitive pushes.</p>
              <span className="text-blue-600 font-medium">+15% base OR +$0.02/call</span>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">AI appointment optimization</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">Smarter follow-ups to increase bookings.</p>
              <span className="text-blue-600 font-medium">+$200/mo</span>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6 relative">
              <div className="absolute -top-2 -right-2">
                <ComingSoonBadge />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-500">Lead scraping</h3>
              </div>
              <p className="text-gray-500 text-sm mb-3">Auto-fill your funnel with targeted leads.</p>
              <span className="text-gray-400 font-medium">TBD</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "What counts as a call?",
                a: "A call is counted when our AI agent successfully connects to a number and begins conversation, regardless of duration."
              },
              {
                q: "Do you charge for failed/out-of-service numbers?",
                a: "No, we only charge for successful connections. Failed calls, busy signals, and disconnected numbers are not counted."
              },
              {
                q: "What about international rates?",
                a: "Our standard rates apply globally. Some regions may have additional carrier fees which will be clearly disclosed."
              },
              {
                q: "Can I switch plans later?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle."
              },
              {
                q: "Do you offer pilots?",
                a: "Yes, we offer pilot programs for enterprise customers to test our platform with a limited number of calls."
              },
              {
                q: "Do you integrate with my CRM?",
                a: "We integrate with popular CRMs like Salesforce, HubSpot, and Pipedrive. Custom integrations are available for enterprise plans."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to outcall the competition?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              Start a campaign <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-8 py-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              Talk to sales
            </button>
          </div>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-4 left-4 right-4 md:hidden z-40">
        <button className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg">
          Talk to sales
        </button>
      </div>
    </div>
  );
};

export default Pricing;