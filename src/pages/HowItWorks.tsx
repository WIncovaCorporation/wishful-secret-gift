import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Gift } from "lucide-react";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

const HowItWorks = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Logo, Back Button and Language Selector */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/")}
                className="gap-2"
                aria-label="Home"
              >
                <Gift className="w-5 h-5 text-primary" />
                <span className="font-semibold">Givlyn</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
                aria-label={t("howItWorks.backButton")}
              >
                <ArrowLeft className="w-4 h-4" />
                {t("howItWorks.backButton")}
              </Button>
            </div>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold">
            {t("howItWorks.title")}
          </h1>
          <p className="text-xl text-muted-foreground">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-card border rounded-xl overflow-hidden mb-12">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 text-left font-semibold">{t("howItWorks.comparisonDirect")}</th>
                <th className="p-4 text-left font-semibold">{t("howItWorks.comparisonGiftApp")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-4 flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-destructive mt-0.5" aria-hidden="true" />
                  <span>{t("howItWorks.noAI")}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5" aria-hidden="true" />
                    <span>{t("howItWorks.hasAI")}</span>
                  </div>
                </td>
              </tr>
              <tr className="border-t bg-muted/20">
                <td className="p-4 flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-destructive mt-0.5" aria-hidden="true" />
                  <span>{t("howItWorks.wasteTime")}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5" aria-hidden="true" />
                    <span>{t("howItWorks.weCompare")}</span>
                  </div>
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-4 flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-destructive mt-0.5" aria-hidden="true" />
                  <span>{t("howItWorks.noPriceCheck")}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5" aria-hidden="true" />
                    <span>{t("howItWorks.priceHistory")}</span>
                  </div>
                </td>
              </tr>
              <tr className="border-t bg-muted/20">
                <td className="p-4 flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-destructive mt-0.5" aria-hidden="true" />
                  <span>{t("howItWorks.noExtra")}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5" aria-hidden="true" />
                    <span>{t("howItWorks.helpFree")}</span>
                  </div>
                </td>
              </tr>
              <tr className="border-t">
                <td className="p-4 font-bold">{t("howItWorks.price")}</td>
                <td className="p-4 font-bold text-success">{t("howItWorks.samePriceEmphasis")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Transparency Section */}
        <div className="bg-card border rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">🔍 {t("howItWorks.transparencyTitle")}</h2>
          
          <ol className="space-y-4 mb-8">
            <li className="flex gap-3">
              <span className="font-bold text-primary">1.</span>
              <div>{t("howItWorks.step1")}</div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <div>{t("howItWorks.step2")}</div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <div>{t("howItWorks.step3")}</div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <div>{t("howItWorks.step4")}</div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">5.</span>
              <div>{t("howItWorks.step5")}</div>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">6.</span>
              <div>{t("howItWorks.step6")}</div>
            </li>
          </ol>

          <div className="bg-muted/50 border-l-4 border-primary p-6 rounded">
            <h3 className="font-bold mb-3">💡 {t("howItWorks.exampleTitle")}</h3>
            <ul className="space-y-2 text-sm">
              <li>• {t("howItWorks.exampleProduct")}</li>
              <li>• {t("howItWorks.exampleYouPay")}</li>
              <li>• {t("howItWorks.exampleWePay")}</li>
              <li>• {t("howItWorks.exampleYouSave")}</li>
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-bold">❓ {t("howItWorks.faqTitle")}</h2>
          
          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-bold mb-2">{t("howItWorks.faqExpensive")}</h3>
            <p className="text-muted-foreground">
              {t("howItWorks.faqExpensiveAnswer")}
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-bold mb-2">{t("howItWorks.faqSubscription")}</h3>
            <p className="text-muted-foreground">
              {t("howItWorks.faqSubscriptionAnswer")}
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-bold mb-2">{t("howItWorks.faqNotBuy")}</h3>
            <p className="text-muted-foreground">
              {t("howItWorks.faqNotBuyAnswer")}
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-bold mb-2">{t("howItWorks.faqTrust")}</h3>
            <p className="text-muted-foreground">
              {t("howItWorks.faqTrustAnswer")}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-warm p-8 rounded-xl">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            🎁 {t("howItWorks.ctaTitle")}
          </h2>
          <Button 
            size="lg"
            onClick={() => {
              // Dispatch custom event to open AI chat
              window.dispatchEvent(new CustomEvent('openAIChat'));
            }}
            className="bg-white text-primary hover:bg-white/90"
          >
            {t("howItWorks.ctaButton")}
          </Button>
          <p className="text-primary-foreground/80 mt-4 text-sm">
            {t("howItWorks.ctaSubtitle")}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
