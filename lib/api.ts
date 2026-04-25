import { buildPublicApiUrl } from "@/lib/api-url";

type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string>;
};

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  private buildHeaders(
    custom?: Record<string, string>,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...custom,
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(buildPublicApiUrl(path));
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, value);
        }
      });
    }
    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userProfile");
        window.location.href = "/login";
      }
      throw data;
    }

    return data as T;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const response = await fetch(this.buildUrl(path, options?.params), {
      method: "GET",
      headers: this.buildHeaders(options?.headers),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await fetch(this.buildUrl(path, options?.params), {
      method: "POST",
      headers: this.buildHeaders(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await fetch(this.buildUrl(path, options?.params), {
      method: "PUT",
      headers: this.buildHeaders(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const response = await fetch(this.buildUrl(path, options?.params), {
      method: "PATCH",
      headers: this.buildHeaders(options?.headers),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async del<T>(path: string, options?: RequestOptions): Promise<T> {
    const response = await fetch(this.buildUrl(path, options?.params), {
      method: "DELETE",
      headers: this.buildHeaders(options?.headers),
    });
    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient();
