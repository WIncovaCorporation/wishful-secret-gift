import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Gift, Calendar, DollarSign, List, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import LanguageSelector from "@/components/LanguageSelector";

interface Assignment {
  receiver_id: string;
  group_id: string;
  groups?: {
    name: string;
    min_budget: number | null;
    max_budget: number | null;
    exchange_date: string | null;
  };
  receiver_profile?: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface GiftItem {
  id: string;
  name: string;
  category: string | null;
  priority: string | null;
  reference_link: string | null;
  image_url: string | null;
}

const Assignment = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [wishListItems, setWishListItems] = useState<GiftItem[]>([]);

  useEffect(() => {
    loadAssignment();
  }, [groupId]);

  const loadAssignment = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get the user's assignment for this group
      const { data: exchangeData, error: exchangeError } = await supabase
        .from("gift_exchanges")
        .select(`
          receiver_id,
          group_id,
          groups (
            name,
            min_budget,
            max_budget,
            exchange_date
          )
        `)
        .eq("group_id", groupId)
        .eq("giver_id", session.user.id)
        .single();

      if (exchangeError) throw exchangeError;

      // Get receiver's profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", exchangeData.receiver_id)
        .single();

      if (profileError) throw profileError;

      const assignmentWithProfile = {
        ...exchangeData,
        receiver_profile: profileData,
      };

      setAssignment(assignmentWithProfile);

      // Try to get receiver's wish list
      const { data: listData } = await supabase
        .from("group_members")
        .select("list_id")
        .eq("group_id", groupId)
        .eq("user_id", exchangeData.receiver_id)
        .maybeSingle();

      if (listData?.list_id) {
        const { data: itemsData } = await supabase
          .from("gift_items")
          .select("id, name, category, priority, reference_link, image_url")
          .eq("list_id", listData.list_id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (itemsData) {
          setWishListItems(itemsData);
        }
      }
    } catch (error) {
      console.error("Error loading assignment:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message={t("assignment.loading")} />;
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/groups")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("assignment.backToGroup")}
            </Button>
            <LanguageSelector />
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>{t("assignment.notFound")}</CardTitle>
              <CardDescription>{t("assignment.notFoundDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/groups")}>
                {t("assignment.backToGroup")}
              </Button>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/groups")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("assignment.backToGroup")}
          </Button>
          <LanguageSelector />
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header with Privacy Badge */}
          <div className="text-center space-y-2">
            <Badge variant="secondary" className="mb-2">
              <Lock className="h-3 w-3 mr-1" />
              {t("assignment.subtitle")}
            </Badge>
            <h1 className="text-3xl font-bold">{t("assignment.title")}</h1>
            <p className="text-muted-foreground">{assignment.groups?.name}</p>
          </div>

          {/* Main Assignment Card */}
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">{t("assignment.youGiftTo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Receiver Info */}
              <div className="flex flex-col items-center space-y-4 py-6 bg-secondary/30 rounded-lg">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                  {assignment.receiver_profile?.avatar_url ? (
                    <img 
                      src={assignment.receiver_profile.avatar_url} 
                      alt={assignment.receiver_profile.display_name}
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <Gift className="h-12 w-12 text-primary" />
                  )}
                </div>
                <h2 className="text-3xl font-bold text-primary">
                  {assignment.receiver_profile?.display_name}
                </h2>
              </div>

              {/* Group Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                {(assignment.groups?.min_budget || assignment.groups?.max_budget) && (
                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">{t("assignment.budget")}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.groups.min_budget && assignment.groups.max_budget
                          ? `$${assignment.groups.min_budget} - $${assignment.groups.max_budget}`
                          : assignment.groups.min_budget
                          ? `${t("Min")} $${assignment.groups.min_budget}`
                          : `${t("Max")} $${assignment.groups.max_budget}`}
                      </p>
                    </div>
                  </div>
                )}

                {assignment.groups?.exchange_date && (
                  <div className="flex items-start gap-3 p-4 bg-background rounded-lg border">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">{t("assignment.exchangeDate")}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(assignment.groups.exchange_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Wish List Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                {t("assignment.wishList")}
              </CardTitle>
              {wishListItems.length === 0 && (
                <CardDescription>{t("assignment.noWishList")}</CardDescription>
              )}
            </CardHeader>
            {wishListItems.length > 0 && (
              <CardContent>
                <div className="space-y-3">
                  {wishListItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-start gap-3 p-3 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-colors"
                    >
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="h-16 w-16 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{item.name}</h4>
                        {item.category && (
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        )}
                        {item.priority && (
                          <Badge variant="outline" className="mt-1">
                            {item.priority}
                          </Badge>
                        )}
                      </div>
                      {item.reference_link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a 
                            href={item.reference_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {t("View")}
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Confidentiality Reminder */}
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {t("assignment.confidentiality")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("assignment.confidentialityDesc")}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Assignment;
