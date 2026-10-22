import { memo } from "react";
import { ArrowRightUpLine } from "@mingcute/react";
import { SiSoundcloud, SiYoutubemusic } from "react-icons/si";
import type { CatalogSource } from "@/shared/contracts";
import { useTranslation } from "@/languages";

export interface SearchSourceBadgeProps {
  source?: CatalogSource;
  externalUrl?: string;
}

export const SearchSourceBadge = memo(function SearchSourceBadge({
  source,
  externalUrl,
}: SearchSourceBadgeProps) {
  const { t } = useTranslation();
  if (!source) return null;

  const label = t(`search.sources.${source}`);
  const Icon = source === "soundcloud" ? SiSoundcloud : SiYoutubemusic;
  const content = (
    <>
      <Icon size={11} aria-hidden />
      <span>{label}</span>
      {externalUrl ? <ArrowRightUpLine size={11} aria-hidden /> : null}
    </>
  );
  const className = "inline-flex h-[20px] shrink-0 items-center gap-[4px] rounded-[5px] bg-border-alpha-14 px-[6px] text-[10.5px] font-medium leading-none text-text-tertiary transition-colors";

  if (!externalUrl) return <span className={className}>{content}</span>;

  return (
    <a
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("search.open_on_source", { source: label })}
      title={t("search.open_on_source", { source: label })}
      data-prevent-drag
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      className={`${className} no-underline hover:bg-border-alpha-20 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary`}
    >
      {content}
    </a>
  );
});

export default SearchSourceBadge;
