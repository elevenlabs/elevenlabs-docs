"use client";

import { PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";

import { CompositionPlan } from "@/app/actions/create-composition-plan";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CompositionPlanEditorProps {
  plan: CompositionPlan;
  onPlanUpdate: (updatedPlan: CompositionPlan) => void;
  onCompose: () => void;
  prompt: string;
}

export function CompositionPlanEditor({
  plan,
  onPlanUpdate,
  onCompose,
  prompt,
}: CompositionPlanEditorProps) {
  const [editedPlan, setEditedPlan] = useState<CompositionPlan>(plan);

  const updatePlan = (newPlan: CompositionPlan) => {
    setEditedPlan(newPlan);
    onPlanUpdate(newPlan);
  };

  const addGlobalStyle = (type: "positive" | "negative") => {
    const newPlan = { ...editedPlan };
    if (type === "positive") {
      newPlan.positiveGlobalStyles.push("");
    } else {
      newPlan.negativeGlobalStyles.push("");
    }
    updatePlan(newPlan);
  };

  const removeGlobalStyle = (type: "positive" | "negative", index: number) => {
    const newPlan = { ...editedPlan };
    if (type === "positive") {
      newPlan.positiveGlobalStyles.splice(index, 1);
    } else {
      newPlan.negativeGlobalStyles.splice(index, 1);
    }
    updatePlan(newPlan);
  };

  const updateGlobalStyle = (
    type: "positive" | "negative",
    index: number,
    value: string
  ) => {
    const newPlan = { ...editedPlan };
    if (type === "positive") {
      newPlan.positiveGlobalStyles[index] = value;
    } else {
      newPlan.negativeGlobalStyles[index] = value;
    }
    updatePlan(newPlan);
  };

  const updateSection = (
    sectionIndex: number,
    field: string,
    value: string | number
  ) => {
    const newPlan = { ...editedPlan };
    newPlan.sections[sectionIndex] = {
      ...newPlan.sections[sectionIndex],
      [field]: value,
    };
    updatePlan(newPlan);
  };

  const addLocalStyle = (
    sectionIndex: number,
    type: "positive" | "negative"
  ) => {
    const newPlan = { ...editedPlan };
    const section = newPlan.sections[sectionIndex];
    if (type === "positive") {
      section.positiveLocalStyles.push("");
    } else {
      section.negativeLocalStyles.push("");
    }
    updatePlan(newPlan);
  };

  const removeLocalStyle = (
    sectionIndex: number,
    type: "positive" | "negative",
    styleIndex: number
  ) => {
    const newPlan = { ...editedPlan };
    const section = newPlan.sections[sectionIndex];
    if (type === "positive") {
      section.positiveLocalStyles.splice(styleIndex, 1);
    } else {
      section.negativeLocalStyles.splice(styleIndex, 1);
    }
    updatePlan(newPlan);
  };

  const updateLocalStyle = (
    sectionIndex: number,
    type: "positive" | "negative",
    styleIndex: number,
    value: string
  ) => {
    const newPlan = { ...editedPlan };
    const section = newPlan.sections[sectionIndex];
    if (type === "positive") {
      section.positiveLocalStyles[styleIndex] = value;
    } else {
      section.negativeLocalStyles[styleIndex] = value;
    }
    updatePlan(newPlan);
  };

  const totalDuration = editedPlan.sections.reduce(
    (sum, section) => sum + section.durationMs,
    0
  );

  return (
    <div className="flex h-full max-h-full flex-col overflow-hidden">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold">Composition Plan</h1>
        <p className="text-muted-foreground mt-1 text-sm">{prompt}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Total duration: {(totalDuration / 1000).toFixed(1)}s
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 pr-4">
          {/* Global Styles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Global Styles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-sm font-medium text-green-600">
                    Positive Styles
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addGlobalStyle("positive")}
                    className="h-6 w-6 p-0"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {editedPlan.positiveGlobalStyles.map((style, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={style}
                        onChange={(e) =>
                          updateGlobalStyle("positive", index, e.target.value)
                        }
                        placeholder="Enter positive style..."
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeGlobalStyle("positive", index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-sm font-medium text-red-600">
                    Negative Styles
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addGlobalStyle("negative")}
                    className="h-6 w-6 p-0"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {editedPlan.negativeGlobalStyles.map((style, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={style}
                        onChange={(e) =>
                          updateGlobalStyle("negative", index, e.target.value)
                        }
                        placeholder="Enter negative style..."
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeGlobalStyle("negative", index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          {editedPlan.sections.map((section, sectionIndex) => (
            <Card key={sectionIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Input
                    value={section.sectionName}
                    onChange={(e) =>
                      updateSection(sectionIndex, "sectionName", e.target.value)
                    }
                    className="h-auto border-none bg-transparent p-0 text-lg font-semibold"
                  />
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Duration (ms):</Label>
                    <Input
                      type="number"
                      value={section.durationMs}
                      onChange={(e) =>
                        updateSection(
                          sectionIndex,
                          "durationMs",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-20"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-sm font-medium text-green-600">
                      Positive Local Styles
                    </Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addLocalStyle(sectionIndex, "positive")}
                      className="h-6 w-6 p-0"
                    >
                      <PlusIcon className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {section.positiveLocalStyles.map((style, styleIndex) => (
                      <div key={styleIndex} className="flex items-center gap-2">
                        <Input
                          value={style}
                          onChange={(e) =>
                            updateLocalStyle(
                              sectionIndex,
                              "positive",
                              styleIndex,
                              e.target.value
                            )
                          }
                          placeholder="Enter positive local style..."
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            removeLocalStyle(
                              sectionIndex,
                              "positive",
                              styleIndex
                            )
                          }
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-sm font-medium text-red-600">
                      Negative Local Styles
                    </Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addLocalStyle(sectionIndex, "negative")}
                      className="h-6 w-6 p-0"
                    >
                      <PlusIcon className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {section.negativeLocalStyles.map((style, styleIndex) => (
                      <div key={styleIndex} className="flex items-center gap-2">
                        <Input
                          value={style}
                          onChange={(e) =>
                            updateLocalStyle(
                              sectionIndex,
                              "negative",
                              styleIndex,
                              e.target.value
                            )
                          }
                          placeholder="Enter negative local style..."
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            removeLocalStyle(
                              sectionIndex,
                              "negative",
                              styleIndex
                            )
                          }
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-4 flex-shrink-0 border-t pt-4">
        <div className="flex justify-end">
          <Button onClick={onCompose} size="lg" className="px-8">
            Compose Music from Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
