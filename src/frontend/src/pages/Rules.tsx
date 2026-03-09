import ConfigureTournamentRulesModal from "@/components/ConfigureTournamentRulesModal";
import QueryErrorState from "@/components/QueryErrorState";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cricketRules, getTournamentRules } from "@/data/cricketRules";
import type { CricketRuleCategory } from "@/data/cricketRules";
import { useGetTournamentRules } from "@/hooks/useQueries";
import { BookOpen, Loader2, Settings } from "lucide-react";
import { useState } from "react";

// suppress unused import warning — Loader2 used in skeleton fallback
void Loader2;

export default function Rules() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const {
    data: tournamentRules,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetTournamentRules();

  const tournamentRuleCategories: CricketRuleCategory[] = tournamentRules
    ? getTournamentRules(tournamentRules)
    : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Rules</h2>
          <p className="text-sm text-muted-foreground">
            Cricket rules and tournament configuration
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowConfigModal(true)}
        >
          <Settings size={14} className="mr-1" />
          Configure
        </Button>
      </div>

      <Tabs defaultValue="standard">
        <TabsList className="w-full">
          <TabsTrigger value="standard" className="flex-1">
            Standard Rules
          </TabsTrigger>
          <TabsTrigger value="tournament" className="flex-1">
            Tournament Rules
          </TabsTrigger>
        </TabsList>

        {/* Standard Rules Tab */}
        <TabsContent value="standard" className="mt-4">
          <Accordion type="single" collapsible className="space-y-2">
            {cricketRules.map((category, idx) => (
              <AccordionItem
                key={category.category}
                value={`standard-${idx}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {category.rules.length}
                    </Badge>
                    <span className="font-semibold">{category.category}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    {category.rules.map((rule) => (
                      <div key={rule.title} className="space-y-1">
                        <p className="font-medium text-sm">{rule.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {rule.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* Tournament Rules Tab */}
        <TabsContent value="tournament" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <QueryErrorState
              error={error}
              title="Failed to load tournament rules"
              onRetry={() => refetch()}
            />
          ) : tournamentRuleCategories.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <BookOpen
                  size={40}
                  className="mx-auto mb-3 text-muted-foreground/40"
                />
                <p className="text-muted-foreground">
                  No tournament rules configured yet
                </p>
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={() => setShowConfigModal(true)}
                >
                  Configure Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {tournamentRuleCategories.map((category, idx) => (
                <AccordionItem
                  key={category.category}
                  value={`tournament-${idx}`}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {category.rules.length}
                      </Badge>
                      <span className="font-semibold">{category.category}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pb-2">
                      {category.rules.map((rule) => (
                        <div key={rule.title} className="space-y-1">
                          <p className="font-medium text-sm">{rule.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {rule.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>

      <ConfigureTournamentRulesModal
        open={showConfigModal}
        onOpenChange={setShowConfigModal}
      />
    </div>
  );
}
