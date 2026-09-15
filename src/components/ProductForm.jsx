import { useState, useEffect } from "react";
import { uploadImage, resolveImageUrl } from "../services/api";

const emptyForm = {
  name: "", description: "", price: "", discount_price: "", image_url: "", stock: "",
  colors: "", sizes: "", length_cm: "", width_cm: "", fit: "", weight_min: "", weight_max: "",
};

export default function ProductForm({ editingProduct, onSubmit, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        description: editingProduct.description || "",
        price: editingProduct.price,
        discount_price: editingProduct.discount_price ?? "",
        image_url: editingProduct.image_url || "",
        stock: editingProduct.stock,
        colors: editingProduct.colors || "",
        sizes: editingProduct.sizes || "",
        length_cm: editingProduct.length_cm ?? "",
        width_cm: editingProduct.width_cm ?? "",
        fit: editingProduct.fit || "",
        weight_min: editingProduct.weight_min ?? "",
        weight_max: editingProduct.weight_max ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingProduct]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const result = await uploadImage(file);
      setForm((prev) => ({ ...prev, image_url: result.image_url }));
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        price: parseFloat(form.price),
        discount_price: form.discount_price === "" ? null : parseFloat(form.discount_price),
        stock: parseInt(form.stock, 10),
        length_cm: form.length_cm === "" ? null : parseFloat(form.length_cm),
        width_cm: form.width_cm === "" ? null : parseFloat(form.width_cm),
        weight_min: form.weight_min === "" ? null : parseFloat(form.weight_min),
        weight_max: form.weight_max === "" ? null : parseFloat(form.weight_max),
      });
      if (!editingProduct) setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h3>{editingProduct ? "تعديل منتج" : "إضافة منتج جديد"}</h3>

      <label>اسم المنتج
        <input name="name" value={form.name} onChange={handleChange} required />
      </label>

      <label>الوصف
        <textarea name="description" value={form.description} onChange={handleChange} rows={2} />
      </label>

      <div className="admin-form-row">
        <label>السعر الأصلي
          <input type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" required />
        </label>
        <label>سعر الخصم (اختياري)
          <input type="number" name="discount_price" value={form.discount_price} onChange={handleChange} min="0" step="0.01" placeholder="اتركه فاضي لو مفيش خصم" />
        </label>
      </div>

      <label>الكمية بالمخزون
        <input type="number" name="stock" value={form.stock} onChange={handleChange} min="0" required />
      </label>

      <label>صورة المنتج (jpg فقط)
        <input type="file" accept="image/jpeg" onChange={handleImageChange} />
      </label>
      {uploading && <p className="upload-status">جاري رفع الصورة...</p>}
      {uploadError && <p className="status-msg status-error">{uploadError}</p>}
      {form.image_url && !uploading && (
        <img src={resolveImageUrl(form.image_url)} alt="معاينة" className="image-preview" />
      )}

      <h4 className="admin-form-subtitle">مواصفات الهودي (اختياري)</h4>

      <label>الألوان المتاحة
        <input name="colors" value={form.colors} onChange={handleChange} placeholder="أسود, كحلي, رمادي" />
      </label>

      <label>المقاسات المتاحة
        <input name="sizes" value={form.sizes} onChange={handleChange} placeholder="S, M, L, XL" />
      </label>

      <label>القصة (Fit)
        <input name="fit" value={form.fit} onChange={handleChange} placeholder="أوفر سايز / Regular Fit" />
      </label>

      <div className="admin-form-row">
        <label>الطول (سم)
          <input type="number" name="length_cm" value={form.length_cm} onChange={handleChange} min="0" />
        </label>
        <label>العرض (سم)
          <input type="number" name="width_cm" value={form.width_cm} onChange={handleChange} min="0" />
        </label>
      </div>

      <div className="admin-form-row">
        <label>مناسب لوزن من (كجم)
          <input type="number" name="weight_min" value={form.weight_min} onChange={handleChange} min="0" />
        </label>
        <label>إلى وزن (كجم)
          <input type="number" name="weight_max" value={form.weight_max} onChange={handleChange} min="0" />
        </label>
      </div>

      <div className="admin-form-actions">
        <button type="submit" className="btn-checkout" disabled={saving || uploading}>
          {saving ? "جاري الحفظ..." : editingProduct ? "حفظ التعديلات" : "إضافة المنتج"}
        </button>
        {editingProduct && <button type="button" className="btn-cancel" onClick={onCancel}>إلغاء</button>}
      </div>
    </form>
  );
}
