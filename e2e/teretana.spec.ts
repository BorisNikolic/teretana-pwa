import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('shows empty state and can add a workout', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toHaveText('Treninzi')
    await expect(page.locator('text=Dodaj svoj prvi trening')).toBeVisible()

    // Add workout
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await expect(page.locator('text=Novi trening')).toBeVisible()
    await page.fill('input[placeholder="Naziv treninga"]', 'Dan A - Leđa')
    await page.click('button:has-text("Sačuvaj")')

    await expect(page.locator('text=Dan A - Leđa')).toBeVisible()
    await expect(page.locator('text=Dodaj svoj prvi trening')).not.toBeVisible()
  })

  test('can delete a workout', async ({ page }) => {
    await page.goto('/')
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.fill('input[placeholder="Naziv treninga"]', 'Za brisanje')
    await page.click('button:has-text("Sačuvaj")')
    await expect(page.locator('text=Za brisanje')).toBeVisible()

    await page.click('button:has(svg path[d*="M9 2a1 1 0"])')
    await expect(page.locator('text=Za brisanje')).not.toBeVisible()
  })

  test('navigates to log, progress, and settings', async ({ page }) => {
    await page.goto('/')
    // Log
    await page.click('[class*="gap-2"] button:nth-child(1)')
    await expect(page.locator('h1')).toHaveText('Dnevnik')
    await page.goBack()
    // Progress
    await page.click('[class*="gap-2"] button:nth-child(2)')
    await expect(page.locator('h1')).toHaveText('Napredak')
    await page.goBack()
    // Settings
    await page.click('[class*="gap-2"] button:nth-child(3)')
    await expect(page.locator('h1')).toHaveText('Podešavanja')
  })
})

test.describe('Workout Detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.fill('input[placeholder="Naziv treninga"]', 'Test Workout')
    await page.click('button:has-text("Sačuvaj")')
    await page.click('text=Test Workout')
  })

  test('shows empty state for exercises', async ({ page }) => {
    await expect(page.locator('text=Dodaj vežbe u ovaj trening')).toBeVisible()
  })

  test('can add a strength exercise', async ({ page }) => {
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await expect(page.locator('text=Nova vežba')).toBeVisible()
    await expect(page.locator('button:has-text("Tegovi")')).toHaveClass(/bg-blue-600/)
    await page.fill('input[placeholder="Naziv vežbe"]', 'Bench Press')
    await page.click('button:has-text("Sačuvaj")')
    await expect(page.locator('text=Bench Press')).toBeVisible()
    await expect(page.locator('text=3 × 10')).toBeVisible()
  })

  test('can add a cardio exercise', async ({ page }) => {
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.click('button:has-text("Kardio")')
    await page.fill('input[placeholder*="Trčanje"]', 'Trčanje')
    await page.click('button:has-text("Sačuvaj")')
    await expect(page.locator('text=Trčanje')).toBeVisible()
    await expect(page.locator('text=Kardio')).toBeVisible()
  })

  test('can edit an exercise', async ({ page }) => {
    // Add exercise first
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.fill('input[placeholder="Naziv vežbe"]', 'Squat')
    await page.click('button:has-text("Sačuvaj")')

    // Click edit icon (pencil)
    await page.click('svg path[d*="M16.862 4.487"]')
    await expect(page.locator('text=Izmeni vežbu')).toBeVisible()
    await page.fill('input[value="Squat"]', 'Back Squat')
    await page.click('button:has-text("Sačuvaj")')
    await expect(page.locator('text=Back Squat')).toBeVisible()
  })

  test('shows finish workout button', async ({ page }) => {
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.fill('input[placeholder="Naziv vežbe"]', 'Test Ex')
    await page.click('button:has-text("Sačuvaj")')
    await expect(page.locator('button:has-text("Završi trening")')).toBeVisible()
  })

  test('session summary shows WhatsApp share', async ({ page }) => {
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.fill('input[placeholder="Naziv vežbe"]', 'Deadlift')
    await page.click('button:has-text("Sačuvaj")')
    await page.click('button:has-text("Završi trening")')
    await expect(page.locator('text=Završen trening')).toBeVisible()
    await expect(page.locator('button:has-text("Pošalji Marku")')).toBeVisible()
    await expect(page.locator('button:has-text("Kopiraj tekst")')).toBeVisible()
  })
})

test.describe('Exercise Detail - Strength', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.fill('input[placeholder="Naziv treninga"]', 'Strength Test')
    await page.click('button:has-text("Sačuvaj")')
    await page.click('text=Strength Test')
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.fill('input[placeholder="Naziv vežbe"]', 'Lat Pulldown')
    await page.click('button:has-text("Sačuvaj")')
    await page.click('text=Lat Pulldown')
  })

  test('shows exercise info cards', async ({ page }) => {
    await page.waitForTimeout(500)
    await expect(page.locator('text=Serije').first()).toBeVisible()
    await expect(page.locator('text=Ponavljanja')).toBeVisible()
    await expect(page.locator('text=Pauza')).toBeVisible()
  })

  test('can enter weight and complete a set', async ({ page }) => {
    const weightInputs = page.locator('input[type="number"]')
    await weightInputs.first().fill('45')
    // Click first unchecked circle
    await page.locator('svg circle').first().click()
    // Should show green checkmark and timer
    await expect(page.locator('text=Pauza:')).toBeVisible()
    await expect(page.locator('text=Preskoči')).toBeVisible()
  })

  test('shows exercise counter and prev/next navigation', async ({ page }) => {
    await expect(page.locator('text=1 / 1')).toBeVisible()
  })

  test('shows recording section', async ({ page }) => {
    await expect(page.locator('text=Moj snimak')).toBeVisible()
    await expect(page.locator('text=Snimi se')).toBeVisible()
  })

  test('can open exercise history', async ({ page }) => {
    // Click clock icon in header
    await page.locator('svg path[d*="M12 8v4l3 3"]').first().click()
    await expect(page.locator('text=Istorija')).toBeVisible()
    await expect(page.locator('text=Još nema upisanih podataka')).toBeVisible()
  })
})

test.describe('Exercise Detail - Cardio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.fill('input[placeholder="Naziv treninga"]', 'Cardio Test')
    await page.click('button:has-text("Sačuvaj")')
    await page.click('text=Cardio Test')
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.click('button:has-text("Kardio")')
    await page.fill('input[placeholder*="Trčanje"]', 'Traka')
    await page.click('button:has-text("Sačuvaj")')
    await page.click('text=Traka')
  })

  test('shows cardio inputs', async ({ page }) => {
    await expect(page.locator('text=min').first()).toBeVisible()
    await expect(page.locator('text=km/h')).toBeVisible()
    await expect(page.locator('text=%')).toBeVisible()
  })

  test('can save cardio data', async ({ page }) => {
    const inputs = page.locator('input[type="number"]')
    await inputs.nth(0).fill('20')
    await inputs.nth(1).fill('6.5')
    await inputs.nth(2).fill('3')
    await page.click('button:has-text("Sačuvaj")')
    await expect(page.locator('text=Sačuvano ✓')).toBeVisible()
  })
})

test.describe('Settings', () => {
  test('can save body weight', async ({ page }) => {
    await page.goto('/#/settings')
    await expect(page.locator('text=Telesna težina')).toBeVisible()
    await page.locator('input[placeholder*="kg"]').fill('82.5')
    await page.click('button:has-text("Sačuvaj")')
    await expect(page.locator('text=82.5 kg')).toBeVisible()
  })

  test('shows backup/restore section', async ({ page }) => {
    await page.goto('/#/settings')
    await expect(page.locator('text=Backup podataka')).toBeVisible()
    await expect(page.locator('button:has-text("Izvezi backup")')).toBeVisible()
    await expect(page.locator('button:has-text("Uvezi backup")')).toBeVisible()
  })

  test('shows weekly summary section', async ({ page }) => {
    await page.goto('/#/settings')
    await expect(page.locator('button:has-text("Generiši nedeljni pregled")')).toBeVisible()
    await page.click('button:has-text("Generiši nedeljni pregled")')
    await expect(page.locator('text=Nedeljni pregled')).toBeVisible()
  })
})

test.describe('Progress Report', () => {
  test('shows month navigation', async ({ page }) => {
    await page.goto('/#/progress')
    await expect(page.locator('h1')).toHaveText('Napredak')
    // Should show current month name
    await expect(page.locator('span.capitalize')).toBeVisible()
  })
})

test.describe('Workout Log', () => {
  test('shows empty state', async ({ page }) => {
    await page.goto('/#/log')
    await expect(page.locator('h1')).toHaveText('Dnevnik')
    await expect(page.locator('text=Još nema zabeleženih treninga')).toBeVisible()
  })

  test('shows logged workout after completing a set', async ({ page }) => {
    // Create workout + exercise + log a set
    await page.goto('/')
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.fill('input[placeholder="Naziv treninga"]', 'Log Test')
    await page.click('button:has-text("Sačuvaj")')
    await page.click('text=Log Test')
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.fill('input[placeholder="Naziv vežbe"]', 'Row')
    await page.click('button:has-text("Sačuvaj")')
    await page.click('text=Row')
    await page.locator('input[type="number"]').first().fill('50')
    await page.locator('svg circle').first().click()
    await page.waitForTimeout(500)

    // Check log
    await page.goto('/#/log')
    await expect(page.locator('text=Log Test')).toBeVisible()
    await expect(page.locator('text=/Row.*50.*kg/')).toBeVisible()
  })
})
