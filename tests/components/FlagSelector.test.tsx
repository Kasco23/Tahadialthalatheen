import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FlagSelector from "../../src/components/FlagSelector";
import LogoSelector from "../../src/components/LogoSelector";

// Mock react-country-flag
vi.mock("react-country-flag", () => ({
  default: ({
    countryCode,
    title,
    ...props
  }: {
    countryCode: string;
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }) => (
    <div data-testid="flag" data-country={countryCode} title={title} {...props}>
      Flag: {countryCode}
    </div>
  ),
}));

// Mock Supabase
vi.mock("../../src/lib/supabaseClient", () => {
  const mockInvoke = vi.fn();
  return {
    supabase: {
      functions: {
        invoke: mockInvoke,
      },
    },
  };
});

// Get the mock for use in tests
import { supabase } from "../../src/lib/supabaseClient";

describe("FlagSelector Component", () => {
  it("renders with default title", () => {
    const mockOnFlagSelect = vi.fn();

    render(<FlagSelector onFlagSelect={mockOnFlagSelect} />);

    expect(screen.getByText("Select Your Flag")).toBeInTheDocument();
  });

  it("renders with custom title", () => {
    const mockOnFlagSelect = vi.fn();

    render(
      <FlagSelector
        onFlagSelect={mockOnFlagSelect}
        title="Choose Your Country"
      />,
    );

    expect(screen.getByText("Choose Your Country")).toBeInTheDocument();
  });

  it("opens dropdown when clicked", async () => {
    const mockOnFlagSelect = vi.fn();

    render(<FlagSelector onFlagSelect={mockOnFlagSelect} />);

    const dropdownButton = screen.getByRole("button");
    fireEvent.click(dropdownButton);

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Search countries..."),
      ).toBeInTheDocument();
    });
  });

  it("filters countries based on search", async () => {
    const mockOnFlagSelect = vi.fn();

    render(<FlagSelector onFlagSelect={mockOnFlagSelect} />);

    // Open dropdown
    const dropdownButton = screen.getByRole("button");
    fireEvent.click(dropdownButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText("Search countries...");
      fireEvent.change(searchInput, { target: { value: "saudi" } });
    });

    await waitFor(() => {
      expect(screen.getByText("Saudi Arabia")).toBeInTheDocument();
    });
  });

  it("calls onFlagSelect when country is selected", async () => {
    const mockOnFlagSelect = vi.fn();

    render(<FlagSelector onFlagSelect={mockOnFlagSelect} />);

    // Open dropdown
    const dropdownButton = screen.getByRole("button");
    fireEvent.click(dropdownButton);

    await waitFor(() => {
      const saudiOption = screen.getByText("Saudi Arabia");
      fireEvent.click(saudiOption);
    });

    expect(mockOnFlagSelect).toHaveBeenCalledWith("SA");
  });
});

describe("LogoSelector Component", () => {
  const mockLogosResponse = {
    leagues: [
      {
        name: "premier-league",
        displayName: "Premier League",
        teams: [
          {
            name: "manchester-united",
            displayName: "Manchester United",
            logoUrl: "https://example.com/man-utd.png",
          },
          {
            name: "liverpool",
            displayName: "Liverpool",
            logoUrl: "https://example.com/liverpool.png",
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({ data: mockLogosResponse, error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default title", () => {
    const mockOnLogoSelect = vi.fn();

    render(<LogoSelector onLogoSelect={mockOnLogoSelect} />);

    expect(screen.getByText("Choose Your Team Logo")).toBeInTheDocument();
  });

  it("renders with custom title", () => {
    const mockOnLogoSelect = vi.fn();

    render(
      <LogoSelector onLogoSelect={mockOnLogoSelect} title="Pick Team Logo" />,
    );

    expect(screen.getByText("Pick Team Logo")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    const mockOnLogoSelect = vi.fn();

    render(<LogoSelector onLogoSelect={mockOnLogoSelect} />);

    expect(screen.getByText("Loading logos...")).toBeInTheDocument();
  });

  it("displays leagues and teams after loading", async () => {
    const mockOnLogoSelect = vi.fn();

    render(<LogoSelector onLogoSelect={mockOnLogoSelect} />);

    await waitFor(() => {
      expect(screen.getByText("Premier League")).toBeInTheDocument();
    });
  });

  it("expands league when clicked", async () => {
    const mockOnLogoSelect = vi.fn();

    render(<LogoSelector onLogoSelect={mockOnLogoSelect} />);

    await waitFor(() => {
      const leagueButton = screen.getByText("Premier League");
      fireEvent.click(leagueButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Manchester United")).toBeInTheDocument();
      expect(screen.getByText("Liverpool")).toBeInTheDocument();
    });
  });

  it("calls onLogoSelect when team is selected", async () => {
    const mockOnLogoSelect = vi.fn();

    render(<LogoSelector onLogoSelect={mockOnLogoSelect} />);

    await waitFor(() => {
      const leagueButton = screen.getByText("Premier League");
      fireEvent.click(leagueButton);
    });

    await waitFor(() => {
      const teamButton = screen.getByText("Manchester United");
      fireEvent.click(teamButton);
    });

    expect(mockOnLogoSelect).toHaveBeenCalledWith(
      "https://example.com/man-utd.png",
      "Manchester United",
    );
  });

  it("filters teams based on search", async () => {
    const mockOnLogoSelect = vi.fn();

    render(<LogoSelector onLogoSelect={mockOnLogoSelect} />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(
        "Search teams or leagues...",
      );
      fireEvent.change(searchInput, { target: { value: "liverpool" } });
    });

    await waitFor(() => {
      expect(screen.getByText("Liverpool")).toBeInTheDocument();
      expect(screen.queryByText("Manchester United")).not.toBeInTheDocument();
    });
  });

  it("shows error state when API fails", async () => {
    (supabase.functions.invoke as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: "API Error" },
    });

    const mockOnLogoSelect = vi.fn();

    render(<LogoSelector onLogoSelect={mockOnLogoSelect} />);

    await waitFor(() => {
      expect(screen.getByText("API Error")).toBeInTheDocument();
      expect(screen.getByText("Try again")).toBeInTheDocument();
    });
  });
});
