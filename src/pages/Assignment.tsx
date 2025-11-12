import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Gift, Calendar, DollarSign, List, Lock, ChevronDown, ExternalLink, Tag, Palette, Ruler, Package, FileText, Eye, AlertTriangle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import LanguageSelector from "@/components/LanguageSelector";
import { AnonymousChat } from "@/components/AnonymousChat";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Assignment {
  receiver_id: string;
  group_id: string;
  giver_id?: string;
  viewed_at: string | null;
  view_count: number;
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
  color: string | null;
  size: string | null;
  brand: string | null;
  notes: string | null;
}

const Assignment = () => {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [wishListItems, setWishListItems] = useState<GiftItem[]>([]);
  const [showConfirmView, setShowConfirmView] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    loadAssignment();
  }, [groupId]);

  const loadAssignment = async () => {
    try {
      // Critical validation: ensure groupId exists before making queries
      if (!groupId) {
        console.error("No groupId provided");
        setLoading(false);
        return;
      }

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
          giver_id,
          created_at,
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

      // Get view tracking data separately (bypasses TypeScript type issues)
      const { data: viewDataRaw } = await supabase
        .from("gift_exchanges")
        .select("*")
        .eq("group_id", groupId)
        .eq("giver_id", session.user.id)
        .maybeSingle();

      const viewData = viewDataRaw as any;

      const assignmentWithProfile = {
        ...exchangeData,
        giver_id: session.user.id,
        receiver_profile: profileData,
        viewed_at: viewData?.viewed_at || null,
        view_count: viewData?.view_count || 0,
      };

      setAssignment(assignmentWithProfile);
      
      // Check if this is first time viewing
      if (!assignmentWithProfile.viewed_at) {
        setShowConfirmView(true);
      } else {
        setIsRevealed(true);
      }

      // Try to get receiver's wish list
      const { data: listData } = await supabase
        .from("group_members")
        .select("list_id")
        .eq("group_id", groupId)
        .eq("user_id", exchangeData.receiver_id)
        .maybeSingle();

      let finalListId = listData?.list_id;

      // If no list linked in group, get ANY list from the user
      if (!finalListId) {
        const { data: userLists } = await supabase
          .from("gift_lists")
          .select("id")
          .eq("user_id", exchangeData.receiver_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        finalListId = userLists?.id;
      }

      if (finalListId) {
        const { data: itemsData } = await supabase
          .from("gift_items")
          .select("id, name, category, priority, reference_link, image_url, color, size, brand, notes")
          .eq("list_id", finalListId)
          .order("created_at", { ascending: false });

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

  const handleRevealAssignment = async () => {
    if (!assignment || !groupId) return;

    try {
      // Mark as viewed using raw update
      const { error: updateError } = await supabase
        .from("gift_exchanges")
        .update({
          viewed_at: new Date().toISOString(),
          view_count: (assignment.view_count || 0) + 1,
        } as any)
        .eq("group_id", groupId)
        .eq("giver_id", assignment.giver_id);

      if (updateError) throw updateError;

      setIsRevealed(true);
      setShowConfirmView(false);
      toast.success("Asignación revelada. ¡Recuerda mantenerlo en secreto!");
      
      // Reload to get updated data
      await loadAssignment();
    } catch (error) {
      console.error("Error revealing assignment:", error);
      toast.error("Error al revelar asignación");
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

  // Show confirmation dialog before revealing
  if (showConfirmView && !isRevealed) {
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
              Volver
            </Button>
            <LanguageSelector />
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
              <CardTitle className="text-center">⚠️ Advertencia Importante</CardTitle>
              <CardDescription className="text-center">
                Estás a punto de ver tu asignación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-yellow-500/50 bg-yellow-500/5">
                <Eye className="h-4 w-4" />
                <AlertTitle>Solo podrás ver esto una vez</AlertTitle>
                <AlertDescription>
                  Una vez que reveles tu asignación, no podrás volver a ver la confirmación. 
                  Asegúrate de estar listo y de tomar nota de la persona asignada.
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Mantén en secreto tu asignación</p>
                <p>• No compartas esta información con nadie</p>
                <p>• Toma nota del nombre de tu asignado/a</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/groups")}
                  className="flex-1"
                >
                  Volver
                </Button>
                <Button
                  onClick={handleRevealAssignment}
                  className="flex-1 gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Revelar Asignación
                </Button>
              </div>
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
            {assignment.viewed_at && (
              <Badge variant="outline" className="text-xs">
                Vista por primera vez: {new Date(assignment.viewed_at).toLocaleDateString()}
              </Badge>
            )}
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
              {wishListItems.length === 0 ? (
                <CardDescription>{t("assignment.noWishList")}</CardDescription>
              ) : (
                <CardDescription>
                  {wishListItems.length} {wishListItems.length === 1 ? 'item' : 'items'}
                </CardDescription>
              )}
            </CardHeader>
            {wishListItems.length > 0 && (
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {wishListItems.map((item, index) => (
                    <AccordionItem key={item.id} value={`item-${item.id}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1 text-left">
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="h-12 w-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-base">{index + 1}. {item.name}</span>
                              {item.priority && (
                                <Badge 
                                  variant={
                                    item.priority === 'high' ? 'destructive' : 
                                    item.priority === 'medium' ? 'default' : 
                                    'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {item.priority}
                                </Badge>
                              )}
                            </div>
                            {item.category && (
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-4 space-y-4">
                          {/* Image Display */}
                          {item.image_url && (
                            <div className="flex justify-center">
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="max-w-full h-auto max-h-64 object-contain rounded-lg border"
                              />
                            </div>
                          )}

                          {/* Item Details Grid */}
                          <div className="grid gap-3 sm:grid-cols-2">
                            {item.brand && (
                              <div className="flex items-start gap-2 p-3 bg-secondary/20 rounded-lg">
                                <Package className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-muted-foreground">{t("Brand")}</p>
                                  <p className="text-sm font-semibold truncate">{item.brand}</p>
                                </div>
                              </div>
                            )}

                            {item.color && (
                              <div className="flex items-start gap-2 p-3 bg-secondary/20 rounded-lg">
                                <Palette className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-muted-foreground">{t("Color")}</p>
                                  <p className="text-sm font-semibold truncate">{item.color}</p>
                                </div>
                              </div>
                            )}

                            {item.size && (
                              <div className="flex items-start gap-2 p-3 bg-secondary/20 rounded-lg">
                                <Ruler className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-muted-foreground">{t("Size")}</p>
                                  <p className="text-sm font-semibold truncate">{item.size}</p>
                                </div>
                              </div>
                            )}

                            {item.category && (
                              <div className="flex items-start gap-2 p-3 bg-secondary/20 rounded-lg">
                                <Tag className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-muted-foreground">{t("Category")}</p>
                                  <p className="text-sm font-semibold truncate">{item.category}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Notes Section */}
                          {item.notes && (
                            <div className="p-3 bg-secondary/20 rounded-lg">
                              <div className="flex items-start gap-2 mb-2">
                                <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                <p className="text-xs font-medium text-muted-foreground">{t("Notes")}</p>
                              </div>
                              <p className="text-sm whitespace-pre-wrap ml-6">{item.notes}</p>
                            </div>
                          )}

                          {/* Reference Link */}
                          {item.reference_link && (
                            <Button
                              className="w-full"
                              variant="default"
                              asChild
                            >
                              <a 
                                href={item.reference_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                {t("View Reference Link")}
                              </a>
                            </Button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            )}
          </Card>

          {/* Anonymous Chat Component */}
          <AnonymousChat 
            groupId={groupId!}
            receiverId={assignment.receiver_id}
            currentUserId={assignment.giver_id!}
          />

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
