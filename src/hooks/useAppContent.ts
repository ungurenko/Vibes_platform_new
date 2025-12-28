import { useState, useEffect } from 'react';
import { fetchAppContent } from '../lib/supabase';
import { 
    COURSE_MODULES, 
    PROMPTS_DATA, 
    PROMPT_CATEGORIES_DATA, 
    ROADMAPS_DATA, 
    STYLES_DATA, 
    GLOSSARY_DATA, 
    DASHBOARD_STAGES 
} from '../constants/data';
import { CourseModule, PromptItem, PromptCategoryItem, Roadmap, StyleCard, GlossaryTerm, DashboardStage } from '../types';

export const useAppContent = () => {
  const [modules, setModules] = useState<CourseModule[]>(COURSE_MODULES);
  const [prompts, setPrompts] = useState<PromptItem[]>(PROMPTS_DATA);
  const [promptCategories, setPromptCategories] = useState<PromptCategoryItem[]>(PROMPT_CATEGORIES_DATA);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>(ROADMAPS_DATA);
  const [styles, setStyles] = useState<StyleCard[]>(STYLES_DATA);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>(GLOSSARY_DATA);
  const [stages, setStages] = useState<DashboardStage[]>(DASHBOARD_STAGES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
      setIsLoading(true);
      try {
        const [dbModules, dbPrompts, dbPromptCategories, dbRoadmaps, dbStyles, dbGlossary, dbStages] = await Promise.all([
            fetchAppContent('modules'),
            fetchAppContent('prompts'),
            fetchAppContent('promptCategories'),
            fetchAppContent('roadmaps'),
            fetchAppContent('styles'),
            fetchAppContent('glossary'),
            fetchAppContent('stages')
        ]);

        if (dbModules) setModules(dbModules);
        if (dbPrompts) setPrompts(dbPrompts);
        if (dbPromptCategories) setPromptCategories(dbPromptCategories);
        if (dbRoadmaps) setRoadmaps(dbRoadmaps);
        if (dbStyles) setStyles(dbStyles);
        if (dbGlossary) setGlossary(dbGlossary);
        if (dbStages) setStages(dbStages);
      } catch (e) {
          console.error("Failed to load app content", e);
      } finally {
          setIsLoading(false);
      }
  };

  return {
      modules, setModules,
      prompts, setPrompts,
      promptCategories, setPromptCategories,
      roadmaps, setRoadmaps,
      styles, setStyles,
      glossary, setGlossary,
      stages, setStages,
      isLoading,
      refreshContent: loadContent
  };
};
