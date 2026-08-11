import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchService } from "../../services/searchService";
import type { SearchResultItem } from "../../services/searchService";
import { Search, Users, Package, FileText, X } from "lucide-react";

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Debounced Search API call
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchService.globalSearch(query);
        setResults(res.data);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Command palette search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle keyboard list navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
      }
    }
  };

  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    navigate(item.url);
  };

  if (!isOpen) return null;

  const getIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "CUSTOMER":
        return <Users size={16} style={{ color: "var(--color-primary)" }} />;
      case "PRODUCT":
        return <Package size={16} style={{ color: "var(--color-success)" }} />;
      case "CHALLAN":
        return <FileText size={16} style={{ color: "var(--color-warning)" }} />;
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 9999, alignItems: "flex-start", paddingTop: "10vh" }}>
      <div
        className="modal-content"
        style={{
          maxWidth: "600px",
          width: "100%",
          padding: 0,
          overflow: "hidden",
          borderRadius: "var(--border-radius-lg)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Search Header Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "var(--spacing-md)",
            borderBottom: "1px solid var(--color-border-light)",
            gap: "var(--spacing-sm)",
          }}
        >
          <Search size={18} className="text-muted" />
          <input
            ref={inputRef}
            type="text"
            className="form-input"
            placeholder="Search Customers, Products, Challans... (Use ↑ ↓ to navigate)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            style={{
              border: "none",
              outline: "none",
              boxShadow: "none",
              fontSize: "var(--font-size-md)",
              width: "100%",
            }}
          />
          <button
            onClick={() => setIsOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Body */}
        <div style={{ maxHeight: "350px", overflowY: "auto", padding: "var(--spacing-xs) 0" }}>
          {loading && (
            <div style={{ padding: "var(--spacing-md)", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
              Searching workspace...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div style={{ padding: "var(--spacing-md)", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
              No matching records found for "{query}".
            </div>
          )}

          {!query && (
            <div style={{ padding: "var(--spacing-md)", fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", textAlign: "center" }}>
              Type a customer name, SKU (e.g. <code>PRD-APP-001</code>), or challan number...
            </div>
          )}

          {!loading &&
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-md)",
                    padding: "var(--spacing-sm) var(--spacing-md)",
                    backgroundColor: isSelected ? "var(--color-bg-base)" : "transparent",
                    cursor: "pointer",
                    borderLeft: isSelected ? "3px solid var(--color-primary)" : "3px solid transparent",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "var(--border-radius-md)",
                      backgroundColor: "var(--color-bg-base)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getIcon(item.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: "var(--font-weight-medium)", fontSize: "var(--font-size-sm)" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.subtitle}
                    </div>
                  </div>
                  <span className="badge" style={{ fontSize: "10px", textTransform: "uppercase" }}>
                    {item.type}
                  </span>
                </div>
              );
            })}
        </div>

        {/* Footer shortcuts helper */}
        <div
          style={{
            padding: "var(--spacing-xs) var(--spacing-md)",
            borderTop: "1px solid var(--color-border-light)",
            backgroundColor: "var(--color-bg-base)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "var(--color-text-secondary)",
          }}
        >
          <span>Use <strong>↑</strong> <strong>↓</strong> to navigate</span>
          <span>Press <strong>Enter</strong> to select</span>
          <span>Press <strong>Esc</strong> to dismiss</span>
        </div>
      </div>
    </div>
  );
};
