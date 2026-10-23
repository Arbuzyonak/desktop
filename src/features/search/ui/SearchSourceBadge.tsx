import { memo } from "react";
import { SiSoundcloud, SiYoutubemusic } from "react-icons/si";
import type { CatalogSource } from "@/shared/contracts";
import { safeSoundCloudExternalUrl } from "@/shared/media/soundcloud/soundcloudExternalUrl";
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
  const safeExternalUrl = source === "soundcloud"
    ? safeSoundCloudExternalUrl(externalUrl)
    : undefined;
  const content = <Icon size={13} aria-hidden />;
  const sourceClass = source === "soundcloud"
    ? "bg-[#ff5500]/15 text-[#ff5500] hover:bg-[#ff5500]/25"
    : "bg-[#ff0033]/15 text-[#ff0033] hover:bg-[#ff0033]/25";
  const className = `inline-flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full transition-colors ${sourceClass}`;

  if (!safeExternalUrl) {
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        data-source-badge={source}
        data-prevent-drag
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        className={className}
      >
        {content}
      </span>
    );
  }

  return (
    <a
      href={safeExternalUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("search.open_on_source", { source: label })}
      title={t("search.open_on_source", { source: label })}
      data-source-badge={source}
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
