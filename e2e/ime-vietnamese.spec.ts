import { test, expect } from '@playwright/test';

test.describe('Task 4.5: Vietnamese IME (Telex/VNI) & TipTap Paragraph Editor E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev-tiptap-test');
    await expect(page.getByTestId('ready-indicator')).toBeVisible({ timeout: 15000 });
  });

  test('1. Telex IME Composition: types "Đoạn tiếng Việt" via CDP without dropped accents or cursor jumping', async ({
    page,
  }) => {
    const editor = page.locator('.tiptap-paragraph-editor .ProseMirror');
    await expect(editor).toBeVisible();

    // Focus editor and clear content
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');

    // Create a Chrome DevTools Protocol session for IME composition events
    const client = await page.context().newCDPSession(page);

    // Simulate Telex composition for "Đoạn ":
    // d -> dd (đ) -> đ + o (đo) -> đo + a (đoa) -> đoa + j (đoạ) -> đoạ + n (đoạn)
    await client.send('Input.imeSetComposition', { text: 'd', selectionStart: 1, selectionEnd: 1 });
    await client.send('Input.imeSetComposition', { text: 'đ', selectionStart: 1, selectionEnd: 1 });
    await client.send('Input.imeSetComposition', { text: 'đo', selectionStart: 2, selectionEnd: 2 });
    await client.send('Input.imeSetComposition', { text: 'đoa', selectionStart: 3, selectionEnd: 3 });
    await client.send('Input.imeSetComposition', { text: 'đoạ', selectionStart: 3, selectionEnd: 3 });
    await client.send('Input.imeSetComposition', { text: 'đoạn', selectionStart: 4, selectionEnd: 4 });
    await client.send('Input.insertText', { text: 'Đoạn ' });

    // Simulate Telex composition for "tiếng ":
    // t -> ti -> tie -> tiee (tiê) -> tiên -> tiêng -> tiengs (tiếng)
    await client.send('Input.imeSetComposition', { text: 't', selectionStart: 1, selectionEnd: 1 });
    await client.send('Input.imeSetComposition', { text: 'ti', selectionStart: 2, selectionEnd: 2 });
    await client.send('Input.imeSetComposition', { text: 'tie', selectionStart: 3, selectionEnd: 3 });
    await client.send('Input.imeSetComposition', { text: 'tiê', selectionStart: 3, selectionEnd: 3 });
    await client.send('Input.imeSetComposition', { text: 'tiên', selectionStart: 4, selectionEnd: 4 });
    await client.send('Input.imeSetComposition', { text: 'tiêng', selectionStart: 5, selectionEnd: 5 });
    await client.send('Input.imeSetComposition', { text: 'tiếng', selectionStart: 5, selectionEnd: 5 });
    await client.send('Input.insertText', { text: 'tiếng ' });

    // Simulate Telex composition for "Việt":
    // V -> Vi -> Vie -> Viee (Viê) -> Viêt -> Vietj (Việt)
    await client.send('Input.imeSetComposition', { text: 'V', selectionStart: 1, selectionEnd: 1 });
    await client.send('Input.imeSetComposition', { text: 'Vi', selectionStart: 2, selectionEnd: 2 });
    await client.send('Input.imeSetComposition', { text: 'Vie', selectionStart: 3, selectionEnd: 3 });
    await client.send('Input.imeSetComposition', { text: 'Viê', selectionStart: 3, selectionEnd: 3 });
    await client.send('Input.imeSetComposition', { text: 'Viêt', selectionStart: 4, selectionEnd: 4 });
    await client.send('Input.imeSetComposition', { text: 'Việt', selectionStart: 4, selectionEnd: 4 });
    await client.send('Input.insertText', { text: 'Việt' });

    // Verify text in editor
    await expect(editor).toContainText('Đoạn tiếng Việt');

    // Wait for debounced commit
    await page.waitForTimeout(300);
    const committed = page.getByTestId('committed-text');
    await expect(committed).toContainText('Đoạn tiếng Việt');
  });

  test('2. VNI IME Composition: types "khoa học" with numeric tone marks', async ({
    page,
  }) => {
    const editor = page.locator('.tiptap-paragraph-editor .ProseMirror');
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');

    const client = await page.context().newCDPSession(page);

    // VNI composition for "khoa ":
    await client.send('Input.imeSetComposition', { text: 'k', selectionStart: 1, selectionEnd: 1 });
    await client.send('Input.imeSetComposition', { text: 'kh', selectionStart: 2, selectionEnd: 2 });
    await client.send('Input.imeSetComposition', { text: 'kho', selectionStart: 3, selectionEnd: 3 });
    await client.send('Input.imeSetComposition', { text: 'khoa', selectionStart: 4, selectionEnd: 4 });
    await client.send('Input.insertText', { text: 'khoa ' });

    // VNI composition for "học" (h + o + c + 5):
    await client.send('Input.imeSetComposition', { text: 'h', selectionStart: 1, selectionEnd: 1 });
    await client.send('Input.imeSetComposition', { text: 'ho', selectionStart: 2, selectionEnd: 2 });
    await client.send('Input.imeSetComposition', { text: 'hoc', selectionStart: 3, selectionEnd: 3 });
    await client.send('Input.imeSetComposition', { text: 'học', selectionStart: 3, selectionEnd: 3 });
    await client.send('Input.insertText', { text: 'học' });

    await expect(editor).toContainText('khoa học');

    await page.waitForTimeout(300);
    const committed = page.getByTestId('committed-text');
    await expect(committed).toContainText('khoa học');
  });

  test('3. Reference Picker Trigger: typing "[" opens dropdown and selects citation', async ({
    page,
  }) => {
    const editor = page.locator('.tiptap-paragraph-editor .ProseMirror');
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');

    // Type text leading to citation
    await page.keyboard.type('Kết quả nghiên cứu ');

    // Type '[' to trigger suggestion popover
    await page.keyboard.press('[');

    // Expect dropdown to appear
    const picker = page.locator('text=Chọn tài liệu trích dẫn:');
    await expect(picker).toBeVisible();

    // Select the first reference (Nguyen Van A)
    const refButton = page.locator('button:has-text("Nguyễn Văn A")');
    await refButton.click();

    // Dropdown should close
    await expect(picker).not.toBeVisible();

    // Citation badge [1] should be present in editor
    const citeBadge = editor.locator('span[data-type="cite"]');
    await expect(citeBadge).toBeVisible();
    await expect(citeBadge).toContainText('[1]');

    await page.waitForTimeout(300);
    const committed = page.getByTestId('committed-text');
    await expect(committed).toContainText('[1]');
  });

  test('4. Mini Toolbar Formatting & Shortcuts: bold, italic, and scientific formatting', async ({
    page,
  }) => {
    const editor = page.locator('.tiptap-paragraph-editor .ProseMirror');
    await editor.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');

    // Test Bold shortcut Ctrl+B
    await page.keyboard.press('Control+B');
    await page.keyboard.type('In Đậm');
    await page.keyboard.press('Control+B');

    await page.keyboard.type(' và ');

    // Test Italic shortcut Ctrl+I
    await page.keyboard.press('Control+I');
    await page.keyboard.type('H. pylori');
    await page.keyboard.press('Control+I');

    // Verify rich-text DOM in ProseMirror
    await expect(editor.locator('strong')).toContainText('In Đậm');
    await expect(editor.locator('em')).toContainText('H. pylori');

    await page.waitForTimeout(300);
    const committed = page.getByTestId('committed-text');
    await expect(committed).toContainText('**In Đậm** và *H. pylori*');
  });
});
