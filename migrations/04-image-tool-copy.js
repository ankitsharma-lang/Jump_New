module.exports = function (migration) {
  const localizedShortText = (contentType, id, name) =>
    contentType
      .createField(id)
      .name(name)
      .type("Symbol")
      .localized(true)
      .required(true)
      .validations([{ size: { max: 128 } }])

  const siteSettings = migration.editContentType("siteSettings")
  localizedShortText(siteSettings, "imageToolFitLabel", "Image Tool Fit Label")
  localizedShortText(siteSettings, "imageToolFocusLabel", "Image Tool Focus Label")
  localizedShortText(siteSettings, "imageToolFormatLabel", "Image Tool Format Label")
  localizedShortText(siteSettings, "imageToolQualityLabel", "Image Tool Quality Label")
  localizedShortText(siteSettings, "imageToolOriginalSizeLabel", "Image Tool Original Size Label")
  localizedShortText(siteSettings, "imageToolOriginalFileLabel", "Image Tool Original File Label")
  localizedShortText(siteSettings, "unknownValueLabel", "Unknown Value Label")
}
