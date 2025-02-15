import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { demos } from '@/lib/demos';

export default function Page() {
  return (
    <div className="space-y-8 p-3.5 lg:p-6">
      <h1 className="text-xl font-bold">Examples</h1>

      <div className="space-y-10">
        {demos.map((section) => {
          return (
            <div key={section.name} className="space-y-5">
              <div className="text-foreground/80 text-xs font-bold uppercase tracking-wider">
                {section.name}
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {section.items.map((item) => {
                  return (
                    <Link href={`/${item.slug}`} key={item.name}>
                      <Card className="border-gradient rounded-lg p-px shadow-lg">
                        <div className="bg-card hover:bg-accent group rounded-lg">
                          <div className="block space-y-1.5 px-5 py-3">
                            <div>
                              <div className="font-bold">{item.name}</div>
                              {item.description ? (
                                <div className="line-clamp-3 text-sm">{item.description}</div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
