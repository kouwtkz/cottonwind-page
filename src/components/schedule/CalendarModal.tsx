type CalendarModalProps = {
  title: string;
  description: string;
};
function CalendarModal({ title, description }: CalendarModalProps) {
  return (
    <div className="absolute">
      <h2>{title}</h2>
      <div>{description}</div>
    </div>
  );
}
