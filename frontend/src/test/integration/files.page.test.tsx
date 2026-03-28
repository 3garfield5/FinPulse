import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import FilesPage from "../../pages/Files";

const listFilesByChatMock = vi.fn();
const listChatsMock = vi.fn();

vi.mock("../../api/files", () => ({
  listFilesByChat: (chatId: number) => listFilesByChatMock(chatId),
  initUpload: vi.fn(),
  putToPresignedUrl: vi.fn(),
  completeUpload: vi.fn(),
  getDownloadUrl: vi.fn(),
  deleteFile: vi.fn(),
}));

vi.mock("../../api/chat", () => ({
  listChats: () => listChatsMock(),
}));

describe("Files page", () => {
  it("shows fallback error when files request fails", async () => {
    listFilesByChatMock.mockRejectedValueOnce(new Error("network"));
    listChatsMock.mockResolvedValueOnce([]);

    render(
      <MemoryRouter initialEntries={["/files?chatId=7"]}>
        <Routes>
          <Route path="/files" element={<FilesPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Не удалось загрузить список файлов")).toBeInTheDocument();
  });

  it("shows empty state when no files", async () => {
    listFilesByChatMock.mockResolvedValueOnce([]);
    listChatsMock.mockResolvedValueOnce([{ id: 7, title: "Main", topic: null, is_default: true }]);

    render(
      <MemoryRouter initialEntries={["/files?chatId=7"]}>
        <Routes>
          <Route path="/files" element={<FilesPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Файлов нет")).toBeInTheDocument();
  });
});
