export default function NotFound() {
  return (
    <div className="container mx-auto">
      <div className="flex flex-col p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Not found</h1>
            <p className="text-muted-foreground">Could not find requested resource</p>
          </div>
        </div>
      </div>
    </div>
  );
}
