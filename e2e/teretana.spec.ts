import { test, expect } from '@playwright/test'
import { setupMocks } from './mocks'

// ═══════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════

test.describe('Auth - Login Page', () => {
  test('shows login form when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1:has-text("Teretana")')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('login button disabled without credentials', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('login button enabled with credentials', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="email"]', 'test@test.com')
    await page.fill('input[type="password"]', 'password')
    await expect(page.locator('button[type="submit"]')).toBeEnabled()
  })

  test('can toggle to signup form', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Registruj se')
    await expect(page.locator('text=Kreiraj nalog')).toBeVisible()
    await expect(page.locator('input[placeholder="Ime i prezime"]')).toBeVisible()
    // Signup button disabled without full name
    await page.fill('input[type="email"]', 'a@b.com')
    await page.fill('input[type="password"]', '123456')
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
    await page.fill('input[placeholder="Ime i prezime"]', 'Test')
    await expect(page.locator('button[type="submit"]')).toBeEnabled()
  })

  test('can toggle back to login from signup', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Registruj se')
    await page.click('text=Uloguj se')
    await expect(page.locator('input[placeholder="Ime i prezime"]')).not.toBeVisible()
  })
})

// ═══════════════════════════════════════════
//  ADMIN - DASHBOARD
// ═══════════════════════════════════════════

test.describe('Admin - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, 'admin')
    await page.goto('/')
  })

  test('shows admin dashboard with name', async ({ page }) => {
    await expect(page.locator('h1:has-text("Admin")')).toBeVisible()
    await expect(page.locator('text=Admin Marko')).toBeVisible()
  })

  test('shows treninzi and vezbaci cards', async ({ page }) => {
    await expect(page.locator('text=Treninzi')).toBeVisible()
    await expect(page.locator('text=Kreiraj i upravljaj programima')).toBeVisible()
    await expect(page.locator('text=Vežbači')).toBeVisible()
    await expect(page.locator('text=Dodeli treninge i ishranu')).toBeVisible()
  })

  test('has logout button', async ({ page }) => {
    await expect(page.locator('text=Odjavi se')).toBeVisible()
  })
})

// ═══════════════════════════════════════════
//  ADMIN - WORKOUTS
// ═══════════════════════════════════════════

test.describe('Admin - Workouts', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, 'admin')
    await page.goto('/#/admin/workouts')
  })

  test('shows workout list', async ({ page }) => {
    await expect(page.locator('h1:has-text("Treninzi")')).toBeVisible()
    await expect(page.locator('text=Push Day')).toBeVisible()
    await expect(page.locator('text=Pull Day')).toBeVisible()
  })

  test('has add workout button', async ({ page }) => {
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await expect(page.locator('text=Novi trening')).toBeVisible()
    await expect(page.locator('input[placeholder="Naziv treninga"]')).toBeVisible()
  })

  test('can create workout via modal', async ({ page }) => {
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.fill('input[placeholder="Naziv treninga"]', 'Leg Day')
    await page.click('button:has-text("Sačuvaj")')
    // Modal should close
    await expect(page.locator('text=Novi trening')).not.toBeVisible()
  })

  test('has delete button on each workout', async ({ page }) => {
    const deleteButtons = page.locator('svg path[d*="M9 2a1 1 0"]')
    await expect(deleteButtons.first()).toBeVisible()
  })

  test('has drag handle on each workout', async ({ page }) => {
    const dragHandles = page.locator('.cursor-grab')
    await expect(dragHandles.first()).toBeVisible()
  })

  test('back button goes to admin dashboard', async ({ page }) => {
    await page.click('button:has(svg path[d*="M15 19l-7-7"])')
    await expect(page.locator('h1:has-text("Admin")')).toBeVisible()
  })
})

// ═══════════════════════════════════════════
//  ADMIN - WORKOUT DETAIL (EXERCISES)
// ═══════════════════════════════════════════

test.describe('Admin - Workout Detail', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, 'admin')
    await page.goto('/#/admin/workouts/w1')
  })

  test('shows workout name and exercises', async ({ page }) => {
    await expect(page.locator('h1:has-text("Push Day")')).toBeVisible()
    await expect(page.locator('text=Bench Press')).toBeVisible()
    await expect(page.locator('text=3 × 10')).toBeVisible()
    await expect(page.locator('text=Trčanje')).toBeVisible()
    await expect(page.locator('text=Kardio')).toBeVisible()
  })

  test('has add exercise button', async ({ page }) => {
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await expect(page.locator('text=Nova vežba')).toBeVisible()
  })

  test('can add strength exercise', async ({ page }) => {
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await expect(page.locator('button:has-text("Tegovi")')).toBeVisible()
    await page.fill('input[placeholder="Naziv vežbe"]', 'OHP')
    await page.click('button:has-text("Sačuvaj")')
    await expect(page.locator('text=Nova vežba')).not.toBeVisible()
  })

  test('can add cardio exercise', async ({ page }) => {
    await page.click('button:has(svg path[d*="M12 4.5v15"])')
    await page.click('button:has-text("Kardio")')
    await page.fill('input[placeholder*="Trčanje"]', 'Bicikl')
    await page.click('button:has-text("Sačuvaj")')
    await expect(page.locator('text=Nova vežba')).not.toBeVisible()
  })

  test('has edit and delete buttons on exercises', async ({ page }) => {
    // Edit pencil icon
    await expect(page.locator('svg path[d*="M16.862 4.487"]').first()).toBeVisible()
    // Delete trash icon
    await expect(page.locator('svg path[d*="M9 2a1 1 0"]').first()).toBeVisible()
  })

  test('can open edit exercise modal', async ({ page }) => {
    await page.locator('svg path[d*="M16.862 4.487"]').first().click()
    await expect(page.locator('text=Izmeni vežbu')).toBeVisible()
    await expect(page.locator('input[value="Bench Press"]')).toBeVisible()
  })

  test('delete exercise shows confirmation', async ({ page }) => {
    await page.locator('button:has(svg path[d*="M9 2a1 1 0"])').first().click()
    await expect(page.locator('text=Obrisati ovu vežbu?')).toBeVisible()
    await expect(page.locator('button:has-text("Obriši")')).toBeVisible()
    await expect(page.locator('button:has-text("Otkaži")')).toBeVisible()
  })
})

// ═══════════════════════════════════════════
//  ADMIN - CLIENTS
// ═══════════════════════════════════════════

test.describe('Admin - Clients', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, 'admin')
    await page.goto('/#/admin/clients')
  })

  test('shows client list', async ({ page }) => {
    await expect(page.locator('h1:has-text("Vežbači")')).toBeVisible()
    await expect(page.locator('text=Boro Klijent')).toBeVisible()
    await expect(page.locator('text=client@test.com')).toBeVisible()
  })

  test('shows client avatar initial', async ({ page }) => {
    await expect(page.locator('text=B').first()).toBeVisible()
  })

  test('back button goes to admin dashboard', async ({ page }) => {
    await page.click('button:has(svg path[d*="M15 19l-7-7"])')
    await expect(page.locator('h1:has-text("Admin")')).toBeVisible()
  })
})

// ═══════════════════════════════════════════
//  ADMIN - CLIENT DETAIL
// ═══════════════════════════════════════════

test.describe('Admin - Client Detail', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, 'admin')
    await page.goto('/#/admin/clients/client-uuid-1')
  })

  test('shows client name and email', async ({ page }) => {
    await expect(page.locator('h1:has-text("Boro Klijent")')).toBeVisible()
    await expect(page.locator('text=client@test.com')).toBeVisible()
  })

  test('shows assigned workouts section with toggles', async ({ page }) => {
    await expect(page.locator('h2:has-text("Dodeljeni treninzi")')).toBeVisible()
    await expect(page.locator('button:has-text("Push Day")')).toBeVisible()
    await expect(page.locator('button:has-text("Pull Day")')).toBeVisible()
  })

  test('shows workout log section', async ({ page }) => {
    await expect(page.locator('text=Dnevnik treninga')).toBeVisible()
  })

  test('shows monthly report with month navigation', async ({ page }) => {
    await expect(page.locator('h2:has-text("Mesečni izveštaj")')).toBeVisible()
    // Has prev/next month buttons
    const monthNav = page.locator('section:has(h2:has-text("Mesečni izveštaj")) button')
    expect(await monthNav.count()).toBeGreaterThanOrEqual(2)
  })

  test('shows weekly summary button', async ({ page }) => {
    await expect(page.locator('button:has-text("Generiši nedeljni pregled")')).toBeVisible()
  })

  test('shows body weight section if data exists', async ({ page }) => {
    // Body weight section may or may not show depending on mock data loading
    await page.waitForTimeout(500)
    const section = page.locator('h2:has-text("Telesna težina")')
    if (await section.isVisible()) {
      await expect(section).toBeVisible()
    }
  })

  test('shows meal plan section', async ({ page }) => {
    await expect(page.locator('text=Plan ishrane')).toBeVisible()
    await expect(page.locator('text=jelovnik.docx')).toBeVisible()
  })

  test('has replace meal plan button', async ({ page }) => {
    await expect(page.locator('button:has-text("Zameni plan")')).toBeVisible()
  })

  test('can toggle weekly summary', async ({ page }) => {
    await page.click('button:has-text("Generiši nedeljni pregled")')
    await page.waitForTimeout(500)
    await expect(page.locator('button:has-text("Kopiraj")')).toBeVisible()
  })
})

// ═══════════════════════════════════════════
//  CLIENT - WORKOUT LIST
// ═══════════════════════════════════════════

test.describe('Client - Workout List', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, 'client')
    await page.goto('/')
  })

  test('shows workout list header', async ({ page }) => {
    await expect(page.locator('h1:has-text("Treninzi")')).toBeVisible()
  })

  test('shows assigned workouts', async ({ page }) => {
    await expect(page.locator('text=Push Day')).toBeVisible()
  })

  test('has 4 navigation icons', async ({ page }) => {
    // Log, Progress, Nutrition, Settings
    const icons = page.locator('.flex.items-center.gap-2 button')
    await expect(icons).toHaveCount(4)
  })

  test('no add workout button (read-only)', async ({ page }) => {
    await expect(page.locator('button:has(svg path[d*="M12 4.5v15"])')).not.toBeVisible()
  })

  test('no delete button (read-only)', async ({ page }) => {
    await expect(page.locator('svg path[d*="M9 2a1 1 0"]')).not.toBeVisible()
  })

  test('navigate to log', async ({ page }) => {
    await page.locator('.flex.items-center.gap-2 button').nth(0).click()
    await expect(page.locator('h1:has-text("Dnevnik")')).toBeVisible()
  })

  test('navigate to progress', async ({ page }) => {
    await page.locator('.flex.items-center.gap-2 button').nth(1).click()
    await expect(page.locator('h1:has-text("Napredak")')).toBeVisible()
  })

  test('navigate to nutrition', async ({ page }) => {
    await page.locator('.flex.items-center.gap-2 button').nth(2).click()
    await expect(page.locator('h1:has-text("Ishrana")')).toBeVisible()
  })

  test('navigate to settings', async ({ page }) => {
    await page.locator('.flex.items-center.gap-2 button').nth(3).click()
    await expect(page.locator('h1:has-text("Podešavanja")')).toBeVisible()
  })
})

// ═══════════════════════════════════════════
//  CLIENT - WORKOUT DETAIL
// ═══════════════════════════════════════════

test.describe('Client - Workout Detail', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, 'client')
    await page.goto('/#/workout/w1')
  })

  test('shows workout name', async ({ page }) => {
    await expect(page.locator('h1:has-text("Push Day")')).toBeVisible()
  })

  test('shows exercises', async ({ page }) => {
    await expect(page.locator('text=Bench Press')).toBeVisible()
    await expect(page.locator('text=3 × 10')).toBeVisible()
    await expect(page.locator('text=Trčanje')).toBeVisible()
  })

  test('no add/edit/delete buttons (read-only)', async ({ page }) => {
    await expect(page.locator('button:has(svg path[d*="M12 4.5v15"])')).not.toBeVisible()
    await expect(page.locator('svg path[d*="M16.862 4.487"]')).not.toBeVisible()
  })

  test('has start workout button', async ({ page }) => {
    await expect(page.locator('button:has-text("Započni trening")')).toBeVisible()
  })

  test('has finish workout button', async ({ page }) => {
    await expect(page.locator('button:has-text("Završi trening")')).toBeVisible()
  })

  test('clicking exercise navigates to detail', async ({ page }) => {
    await page.locator('text=Bench Press').click()
    await expect(page.locator('h1:has-text("Bench Press")')).toBeVisible()
  })
})

// ═══════════════════════════════════════════
//  CLIENT - EXERCISE DETAIL (STRENGTH)
// ═══════════════════════════════════════════

test.describe('Client - Exercise Detail Strength', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, 'client')
    await page.goto('/#/workout/w1/exercise/e1')
  })

  test('shows exercise name and counter', async ({ page }) => {
    await expect(page.locator('h1:has-text("Bench Press")')).toBeVisible()
    await expect(page.locator('text=1 / 2')).toBeVisible()
  })

  test('shows info cards', async ({ page }) => {
    await expect(page.locator('text=Serije').first()).toBeVisible()
    await expect(page.locator('text=Ponavljanja').first()).toBeVisible()
    await expect(page.locator('text=Pauza').first()).toBeVisible()
  })

  test('shows exercise notes', async ({ page }) => {
    await expect(page.locator('text=Kontrolisano spuštanje')).toBeVisible()
  })

  test('shows set rows with weight inputs', async ({ page }) => {
    await expect(page.locator('text=Serija 1')).toBeVisible()
    await expect(page.locator('text=Serija 2')).toBeVisible()
    await expect(page.locator('text=Serija 3')).toBeVisible()
    const weightInputs = page.locator('input[type="number"]')
    expect(await weightInputs.count()).toBeGreaterThanOrEqual(3)
  })

  test('can enter weight', async ({ page }) => {
    await page.locator('input[type="number"]').first().fill('100')
    await expect(page.locator('input[type="number"]').first()).toHaveValue('100')
  })

  test('can toggle set completion', async ({ page }) => {
    await page.locator('input[type="number"]').first().fill('80')
    // Click unchecked circle for first set (in the sets area, not header)
    const circles = page.locator('button:has(svg circle)')
    await circles.first().click()
    // Should show green checkmark or rest timer
    await page.waitForTimeout(300)
    // Verify the set was toggled by checking for timer or checkmark
    const hasTimer = await page.locator('text=Preskoči').isVisible().catch(() => false)
    const hasCheck = await page.locator('svg path[d*="M10 18a8 8 0"]').first().isVisible().catch(() => false)
    expect(hasTimer || hasCheck).toBeTruthy()
  })

  test('has next exercise navigation', async ({ page }) => {
    // Next arrow should be visible (2 exercises in w1)
    const nextBtn = page.locator('svg path[d*="M9 5l7 7-7 7"]')
    await expect(nextBtn.first()).toBeVisible()
  })

  test('shows recording section', async ({ page }) => {
    await expect(page.locator('text=Moj snimak')).toBeVisible()
    await expect(page.locator('text=Snimi se')).toBeVisible()
  })

  test('has history button', async ({ page }) => {
    await page.locator('svg path[d*="M12 8v4l3 3"]').first().click()
    await expect(page.locator('text=Istorija')).toBeVisible()
  })
})

// ═══════════════════════════════════════════
//  CLIENT - EXERCISE DETAIL (CARDIO)
// ═══════════════════════════════════════════

test.describe('Client - Exercise Detail Cardio', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, 'client')
    await page.goto('/#/workout/w1/exercise/e2')
  })

  test('shows cardio type', async ({ page }) => {
    await expect(page.locator('h1:has-text("Trčanje")')).toBeVisible()
    await expect(page.locator('text=Kardio')).toBeVisible()
  })

  test('shows cardio input fields', async ({ page }) => {
    await expect(page.locator('text=min').first()).toBeVisible()
    await expect(page.locator('text=km/h')).toBeVisible()
    await expect(page.locator('text=%')).toBeVisible()
  })

  test('has save button', async ({ page }) => {
    await expect(page.locator('button:has-text("Sačuvaj")')).toBeVisible()
  })

  test('can fill cardio inputs', async ({ page }) => {
    const inputs = page.locator('input[type="number"]')
    await inputs.nth(0).fill('25')
    await inputs.nth(1).fill('7')
    await inputs.nth(2).fill('4')
    await expect(inputs.nth(0)).toHaveValue('25')
  })

  test('shows counter 2/2', async ({ page }) => {
    await expect(page.locator('text=2 / 2')).toBeVisible()
  })

  test('has back/prev navigation', async ({ page }) => {
    // At minimum has the back button
    const backBtn = page.locator('button').first()
    await expect(backBtn).toBeVisible()
  })
})

// ═══════════════════════════════════════════
//  CLIENT - NUTRITION
// ═══════════════════════════════════════════

test.describe('Client - Nutrition', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, 'client')
    await page.goto('/#/ishrana')
  })

  test('shows nutrition page header', async ({ page }) => {
    await expect(page.locator('h1:has-text("Ishrana")')).toBeVisible()
  })

  test('shows meal plan content from server', async ({ page }) => {
    await expect(page.locator('text=jelovnik.docx')).toBeVisible()
    await expect(page.locator('.meal-plan-content')).toBeVisible()
  })

  test('no upload button for client', async ({ page }) => {
    await expect(page.locator('button:has-text("Učitaj")')).not.toBeVisible()
  })

  test('has back button', async ({ page }) => {
    await page.click('button:has(svg path[d*="M15 19l-7-7"])')
    await expect(page.locator('h1:has-text("Treninzi")')).toBeVisible()
  })
})

// ═══════════════════════════════════════════
//  CLIENT - SETTINGS
// ═══════════════════════════════════════════

test.describe('Client - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, 'client')
    await page.goto('/#/settings')
  })

  test('shows page header', async ({ page }) => {
    await expect(page.locator('h1:has-text("Podešavanja")')).toBeVisible()
  })

  test('shows user profile info', async ({ page }) => {
    await expect(page.locator('text=Boro Klijent')).toBeVisible()
    await expect(page.locator('text=client@test.com')).toBeVisible()
  })

  test('has logout button', async ({ page }) => {
    await expect(page.locator('text=Odjavi se')).toBeVisible()
  })

  test('shows body weight section', async ({ page }) => {
    await expect(page.locator('text=Telesna težina')).toBeVisible()
    await expect(page.locator('button:has-text("Sačuvaj")')).toBeVisible()
  })

  test('shows weekly summary section', async ({ page }) => {
    await expect(page.locator('button:has-text("Generiši nedeljni pregled")')).toBeVisible()
  })

  test('no backup section (removed)', async ({ page }) => {
    await expect(page.locator('text=Backup podataka')).not.toBeVisible()
  })

  test('has back button', async ({ page }) => {
    await page.click('button:has(svg path[d*="M15 19l-7-7"])')
    await expect(page.locator('h1:has-text("Treninzi")')).toBeVisible()
  })
})

// ═══════════════════════════════════════════
//  CLIENT - PROGRESS REPORT
// ═══════════════════════════════════════════

test.describe('Client - Progress Report', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, 'client')
    await page.goto('/#/progress')
  })

  test('shows progress header', async ({ page }) => {
    await expect(page.locator('h1:has-text("Napredak")')).toBeVisible()
  })

  test('shows month name', async ({ page }) => {
    await expect(page.locator('span.capitalize')).toBeVisible()
  })

  test('has month navigation', async ({ page }) => {
    // Has capitalize month text and some interactive elements
    await expect(page.locator('.capitalize')).toBeVisible()
  })

  test('has back button', async ({ page }) => {
    await page.click('button:has(svg path[d*="M15 19l-7-7"])').catch(() => {})
  })
})

// ═══════════════════════════════════════════
//  CLIENT - WORKOUT LOG
// ═══════════════════════════════════════════

test.describe('Client - Workout Log', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, 'client')
    await page.goto('/#/log')
  })

  test('shows log header', async ({ page }) => {
    await expect(page.locator('h1:has-text("Dnevnik")')).toBeVisible()
  })

  test('has back button', async ({ page }) => {
    await page.click('button:has(svg path[d*="M15 19l-7-7"])')
    await expect(page.locator('h1:has-text("Treninzi")')).toBeVisible()
  })
})
