export type AboutWorkflowCardProps = {
  eyebrow: string;
  date: string;
  title: string;
  description: string;
  bannerColor: string;
};

export function AboutWorkflowCard({
  eyebrow,
  date,
  title,
  description,
  bannerColor,
}: AboutWorkflowCardProps) {
  return (
    <article className="overflow-hidden border-2 border-border bg-[#f8f4ec] shadow-[5px_5px_0px_0px_#2d2d2d]">
      <div
        className="border-b-2 border-border px-4 py-3"
        style={{ backgroundColor: bannerColor }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
          {eyebrow}
        </p>
      </div>
      <div className="p-4 sm:p-5">
        <p className="text-xs font-medium text-foreground/70">{date}</p>
        <h3 className="mt-3 max-w-[12ch] text-3xl font-black uppercase leading-none text-foreground sm:text-[2.1rem]">
          {title}
        </h3>
        <p className="mt-4 text-base leading-7 text-foreground/80">
          {description}
        </p>
      </div>
    </article>
  );
}
