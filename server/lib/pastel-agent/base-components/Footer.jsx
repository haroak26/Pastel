export default function Footer({ brand = "Acme", columns = [], blurb }) {
  return (
    <footer className="border-t bg-card">
      <div className="pastel-frame py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-semibold tracking-tight">{brand}</p>
            {blurb && (
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">{blurb}</p>
            )}
          </div>
          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="text-sm font-semibold">{col.title}</h4>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <p className="text-xs text-muted-foreground">© 2025 {brand}. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-foreground">Privacy</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-foreground">Terms</a>
            <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-foreground">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
