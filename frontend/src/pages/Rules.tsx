import { useState } from 'react';
import { Search, Settings, BookOpen, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTournamentRules } from '../hooks/useQueries';
import { cricketRules, getTournamentRules, type CricketRuleCategory } from '../data/cricketRules';
import ConfigureTournamentRulesModal from '../components/ConfigureTournamentRulesModal';

interface RuleCategoryProps {
  category: CricketRuleCategory;
  isExpanded: boolean;
  onToggle: () => void;
  searchTerm: string;
}

function RuleCategory({ category, isExpanded, onToggle, searchTerm }: RuleCategoryProps) {
  const filteredRules = category.rules.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredRules.length === 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'oklch(1 0 0)',
        border: '1px solid oklch(0.88 0.015 240)',
        boxShadow: '0 2px 8px oklch(0.22 0.07 240 / 0.08)',
      }}
    >
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{category.icon}</span>
          <span className="font-display text-base font-bold" style={{ color: 'oklch(0.22 0.07 240)' }}>
            {category.category}
          </span>
          <Badge
            className="text-xs"
            style={{
              background: 'oklch(0.65 0.18 45 / 0.12)',
              color: 'oklch(0.55 0.15 45)',
              border: '1px solid oklch(0.65 0.18 45 / 0.25)',
            }}
          >
            {filteredRules.length}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} style={{ color: 'oklch(0.5 0.03 240)' }} />
        ) : (
          <ChevronDown size={16} style={{ color: 'oklch(0.5 0.03 240)' }} />
        )}
      </button>

      {isExpanded && (
        <div className="border-t" style={{ borderColor: 'oklch(0.93 0.01 240)' }}>
          {filteredRules.map((rule, idx) => (
            <div
              key={idx}
              className="px-4 py-3 border-b last:border-b-0"
              style={{ borderColor: 'oklch(0.93 0.01 240)' }}
            >
              <p className="text-sm font-semibold mb-0.5" style={{ color: 'oklch(0.22 0.07 240)' }}>
                {rule.title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.5 0.03 240)' }}>
                {rule.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Rules() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('standard');
  const [configOpen, setConfigOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: tournamentConfig, isLoading: rulesLoading } = useTournamentRules();
  const tournamentRules = tournamentConfig ? getTournamentRules(tournamentConfig) : [];

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const filteredStandard = cricketRules.filter((cat) =>
    cat.rules.some(
      (r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.content.toLowerCase().includes(search.toLowerCase())
    )
  );

  const filteredTournament = tournamentRules.filter((cat) =>
    cat.rules.some(
      (r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.content.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="p-4 space-y-5">
      {/* Page Header */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'linear-gradient(135deg, oklch(0.22 0.07 240), oklch(0.15 0.06 240))',
          boxShadow: '0 4px 12px oklch(0.22 0.07 240 / 0.2)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'oklch(0.97 0.005 240)' }}>
              Rules
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'oklch(0.75 0.03 240)' }}>
              Cricket rules &amp; tournament configuration
            </p>
          </div>
          <BookOpen size={28} style={{ color: 'oklch(0.65 0.18 45)' }} />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'oklch(0.6 0.03 240)' }}
        />
        <Input
          placeholder="Search rules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          style={{ border: '1px solid oklch(0.88 0.015 240)', borderRadius: '0.75rem' }}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className="w-full rounded-xl p-1"
          style={{ background: 'oklch(0.22 0.07 240)' }}
        >
          <TabsTrigger
            value="standard"
            className="flex-1 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-[oklch(0.65_0.18_45)] data-[state=active]:text-[oklch(0.1_0.02_240)]"
            style={{
              color: activeTab === 'standard' ? 'oklch(0.1 0.02 240)' : 'oklch(0.7 0.03 240)',
            }}
          >
            <BookOpen size={14} className="mr-1.5" />
            Standard Rules
          </TabsTrigger>
          <TabsTrigger
            value="tournament"
            className="flex-1 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-[oklch(0.65_0.18_45)] data-[state=active]:text-[oklch(0.1_0.02_240)]"
            style={{
              color: activeTab === 'tournament' ? 'oklch(0.1 0.02 240)' : 'oklch(0.7 0.03 240)',
            }}
          >
            <Trophy size={14} className="mr-1.5" />
            Tournament Rules
          </TabsTrigger>
        </TabsList>

        {/* Standard Rules */}
        <TabsContent value="standard" className="mt-4 space-y-3">
          {filteredStandard.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'oklch(0.5 0.03 240)' }}>
              No rules found for &quot;{search}&quot;
            </div>
          ) : (
            filteredStandard.map((category) => (
              <RuleCategory
                key={category.category}
                category={category}
                isExpanded={expandedCategories.has(category.category)}
                onToggle={() => toggleCategory(category.category)}
                searchTerm={search}
              />
            ))
          )}
        </TabsContent>

        {/* Tournament Rules */}
        <TabsContent value="tournament" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button
              onClick={() => setConfigOpen(true)}
              size="sm"
              className="flex items-center gap-2 font-semibold"
              style={{
                background: 'oklch(0.65 0.18 45)',
                color: 'oklch(0.1 0.02 240)',
                border: 'none',
              }}
            >
              <Settings size={14} />
              Configure Rules
            </Button>
          </div>

          {rulesLoading ? (
            <div className="text-center py-8">
              <div
                className="w-8 h-8 rounded-full border-2 animate-spin mx-auto"
                style={{ borderColor: 'oklch(0.65 0.18 45)', borderTopColor: 'transparent' }}
              />
            </div>
          ) : filteredTournament.length === 0 ? (
            <div className="text-center py-8" style={{ color: 'oklch(0.5 0.03 240)' }}>
              {search ? `No rules found for "${search}"` : 'No tournament rules configured yet.'}
            </div>
          ) : (
            filteredTournament.map((category) => (
              <RuleCategory
                key={category.category}
                category={category}
                isExpanded={expandedCategories.has(category.category)}
                onToggle={() => toggleCategory(category.category)}
                searchTerm={search}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <ConfigureTournamentRulesModal open={configOpen} onOpenChange={setConfigOpen} />
    </div>
  );
}
