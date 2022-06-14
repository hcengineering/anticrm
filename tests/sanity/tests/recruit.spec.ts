import { expect, test } from '@playwright/test'
import { generateId, PlatformSetting, PlatformURI } from './utils'

test.use({
  storageState: PlatformSetting
})

test.describe('recruit tests', () => {
  test.beforeEach(async ({ page }) => {
    // Create user and workspace
    await page.goto(`${PlatformURI}/workbench%3Acomponent%3AWorkbenchApp`)
  })
  test('create-candidate', async ({ page, context }) => {
    await page.locator('[id="app-recruit\\:string\\:RecruitApplication"]').click()

    await page.click('text=Talents')

    await page.click('button:has-text("New Talent")')

    const first = 'Elton-' + generateId(4)
    const last = 'John-' + generateId(4)
    const loc = 'Cupertino'
    const email = `ej-${generateId(4)}@test.com`

    const firstName = page.locator('[placeholder="John"]')
    await firstName.click()
    await firstName.fill(first)

    const lastName = page.locator('[placeholder="Appleseed"]')
    await lastName.click()
    await lastName.fill(last)

    const title = page.locator('[placeholder="Title"]')
    await title.click()
    await title.fill('Super Candidate')

    const location = page.locator('[placeholder="Location"]')
    await location.click()
    await location.fill(loc)

    await page.locator('[id="presentation\\:string\\:AddSocialLinks"]').click()
    await page.locator('.antiPopup').locator('text=Email').click()
    const emailInput = page.locator('[placeholder="john\\.appleseed@apple\\.com"]')
    await emailInput.fill(email)
    await emailInput.press('Enter')

    await page.locator('.antiCard').locator('button:has-text("Create")').click()

    await page.click(`text="${first} ${last}"`)

    await expect(page.locator(`text=${first}`).first()).toBeVisible()
    await expect(page.locator(`text=${last}`).first()).toBeVisible()
    await expect(page.locator(`text=${loc}`).first()).toBeVisible()

    const activity = page.locator('[id="activity\\:string\\:Activity"]')
    await activity.locator('[id="gmail\\:string\\:Email"]').hover()
    await expect(page.locator(`text=${email}`).first()).toBeVisible()
  })

  test('create-application', async ({ page }) => {
    await page.locator('[id="app-recruit\\:string\\:RecruitApplication"]').click()

    const vacancyId = 'My vacancy ' + generateId(4)

    await page.locator('[id="app-recruit\\:string\\:RecruitApplication"]').click()

    await page.locator('text=Vacancies').click()

    await page.click('button:has-text("Vacancy")')
    await page.fill('[placeholder="Software\\ Engineer"]', vacancyId)
    await page.click('button:has-text("Create")')
    await page.locator(`text=${vacancyId}`).click()

    await page.click('text=Talents')

    await page.click('text=Talents')
    await page.click('text=Andrey P.')
    // await page.locator('.mixin-selector').locator('text="Candidate"').click()

    // Click on Add button
    await page.click('.applications-container .flex-row-center .flex-center')

    await page.click('button:has-text("Vacancy")')

    await page.fill('[placeholder="Search..."]', vacancyId)
    await page.click(`button:has-text("${vacancyId}")`)

    await page.click('button:has-text("Create")')

    await page.locator(`tr:has-text("${vacancyId}") >> text=APP-`).click()
    await page.click('button:has-text("Assigned recruiter")')
    await page.click('button:has-text("Rosamund Chen")')
  })

  test('create-vacancy', async ({ page }) => {
    const vacancyId = 'My vacancy ' + generateId(4)

    await page.locator('[id="app-recruit\\:string\\:RecruitApplication"]').click()

    await page.locator('text=Vacancies').click()

    await page.click('button:has-text("Vacancy")')
    await page.fill('form  [placeholder="Software\\ Engineer"]', vacancyId)
    await page.click('form button:has-text("Create")')
    await page.click(`text=${vacancyId}`)

    // Create Applicatio n1
    await page.click('button:has-text("Application")')
    await page.click('form[id="recruit:string:CreateApplication"] button:has-text("Talent")')
    await page.click('button:has-text("Alex P.")')
    await page.click('form[id="recruit:string:CreateApplication"] button:has-text("Create")')

    await expect(page.locator('text=APP-').first()).toBeVisible()
    await expect(page.locator('text=Alex P.').first()).toBeVisible()
  })
  test('use-kanban', async ({ page }) => {
    await page.locator('[id="app-recruit\\:string\\:RecruitApplication"]').click()

    await page.locator('text=Vacancies').click()
    await page.click('text=Software Engineer')

    await page.click('[name="tooltip-task:string:Kanban"]')

    await expect(page.locator('text=Marina M.').first()).toBeVisible()
    await expect(page.locator('text=John Multiseed').first()).toBeVisible()
    await expect(page.locator('text=Alex P.').first()).toBeVisible()
  })

  test('application-search', async ({ page }) => {
    await page.locator('[id="app-recruit\\:string\\:RecruitApplication"]').click()

    await page.locator('text=Vacancies').click()
    await page.click('text=Software Engineer')

    await expect(page.locator('text=Marina M.')).toBeVisible()
    expect(await page.locator('.antiTable-body__row').count()).toBeGreaterThan(2)

    const searchBox = page.locator('[placeholder="Search"]')
    await searchBox.fill('Frontend Engineer')
    await searchBox.press('Enter')

    await expect(page.locator('.antiTable-body__row')).toHaveCount(1)

    await searchBox.fill('')
    await searchBox.press('Enter')

    await expect(page.locator('text=Marina M.')).toBeVisible()
    expect(await page.locator('.antiTable-body__row').count()).toBeGreaterThan(2)
  })

  test('create-interview', async ({ page }) => {
    await page.locator('[id="app-recruit\\:string\\:RecruitApplication"]').click()

    const interviewId = 'My interview ' + generateId(4)

    await page.locator('[id="app-recruit\\:string\\:RecruitApplication"]').click()

    await page.click('text=Reviews')

    await page.click('button:has-text("Review")')

    await page.click('[placeholder="Title"]')

    await page.fill('[placeholder="Title"]', `Meet Peterson ${interviewId}`)

    await page.click('[placeholder="Location"]')

    await page.fill('[placeholder="Location"]', 'NSK')
    await page.click('form button:has-text("Talent")')
    await page.click('button:has-text("Andrey P.")')
    await page.click('text=Create')
    await page.click('td:has-text("RVE-")')
  })

  test('test-create-skill', async ({ page }) => {
    await page.click('[id="app-recruit\\:string\\:RecruitApplication"]')
    await page.click('text=Skills')
    await page.click('button:has-text("Skill")')
    await page.click('[placeholder="Please\\ type\\ skill\\ title"]')
    const skillId = 'custom-skill-' + generateId()
    await page.fill('[placeholder="Please\\ type\\ skill\\ title"]', skillId)
    await page.click('button:has-text("Other")')
    await page.click('button:has-text("Design")')
    await page.click('button:has-text("Create")')
    await page.click(`text=${skillId}`)
    await page.click('[placeholder="Please\\ type\\ description\\ here"]')
    await page.fill('[placeholder="Please\\ type\\ description\\ here"]', 'description-' + skillId)
    await page.click('button:has-text("Save")')
    await page.click(`span:has-text("description-${skillId}")`)
  })
})
