import { memo, type ComponentType } from "react";
import { motion } from "framer-motion";
import { GridFill } from "@mingcute/react";
import { SiSoundcloud, SiYoutubemusic } from "react-icons/si";
import type { SearchSource } from "@/shared/contracts";
import { useTranslation } from "@/languages";

export interface SearchSourceSelectorProps {
  value: SearchSource;
  onChange: (source: SearchSource) => void;
}

const SOURCES: Array<{
  value: SearchSource;
  labelKey: string;
  icon: ComponentType<{ size?: number | string; "aria-hidden"?: boolean }>;
}> = [
  { value: "all", labelKey: "search.sources.all", icon: GridFill },
  { value: "youtube", labelKey: "search.sources.youtube", icon: SiYoutubemusic },
  { value: "soundcloud", labelKey: "search.sources.soundcloud", icon: SiSoundcloud },
];

export const SearchSourceSelector = memo(function SearchSourceSelector({
  value,
  onChange,
}: SearchSourceSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-[5px] overflow-x-auto" role="group" aria-label={t("search.sources.all")}>
      {SOURCES.map(({ value: source, labelKey, icon: Icon }) => {
        const label = t(labelKey);
        const selected = value === source;
        return (
          <button
            key={source}
            type="button"
            aria-label={label}
            aria-pressed={selected}
            onClick={() => onChange(source)}
            className={`relative flex shrink-0 cursor-pointer select-none items-center gap-[7px] rounded-[6px] border-none bg-transparent px-[11px] py-[6px] text-[12.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${selected ? "font-medium text-text-primary" : "font-normal text-text-tertiary hover:bg-border-alpha-14 hover:text-text-primary"}`}
            style={{ fontFamily: "var(--font-inter), sans-serif", lineHeight: "1.2" }}
          >
            {selected ? (
              <motion.span
                layoutId="activeSearchSourcePill"
                className="pointer-events-none absolute inset-0 z-0 rounded-[6px] bg-border-alpha-14"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            ) : null}
            <span className="relative z-[1] flex items-center gap-[7px]">
              <Icon size={14} aria-hidden />
              <span>{label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default SearchSourceSelector;
