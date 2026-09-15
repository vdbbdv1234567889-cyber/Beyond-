import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getProductById, createProduct, updateProduct,
  uploadImage, addProductImage, deleteProductImage,
  addProductDesign, deleteProductDesign, resolveImageUrl,
} from "../services/api";

const emptyForm = {
  name: "", description: "", price: "", discount_price: "", image_url: "", stock: "",
  colors: "", sizes: "", length_cm: "", width_cm: "", fit: "", weight_min: "", weight_max: "",
};

export default function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [gallery, setGallery] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [designName, setDesignName] = useState("");
  const [savedProductId, setSavedProductId] = useState(id || null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditing) {
      getProductById(id).then((p) => {
        setForm({
          name: p.name, description: p.description || "", price: p.price,
          discount_price: p.discount_price ?? "", image_url: p.image_url || "", stock: p.stock,
          colors: p.colors || "", sizes: p.sizes || "", length_cm: p.length_cm ?? "",
          width_cm: p.width_cm ?? "", fit: p.fit || "", weight_min: p.weight_min ?? "", weight_max: p.weight_max ?? "",
        });
        setGallery(p.gallery || []);
        setDesigns(p.designs || []);
        setLoading(false);
      });
    }
  }, [id, isEditing]);

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function handleMainImagesChange(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const result = await uploadImage(file);
        uploaded.push(result.image_url);
      }

      if (!form.image_url) {
        setForm((prev) => ({ ...prev, image_url: uploaded[0] }));
        const rest = uploaded.slice(1);
        if (savedProductId) {
          for (const url of rest) {
            const newImage = await addProductImage(savedProductId, url);
            setGallery((prev) => [...prev, newImage]);
          }
        } else {
          setPendingImages((prev) => [...prev, ...rest]);
        }
      } else {
        if (savedProductId) {
          for (const url of uploaded) {
            const newImage = await addProductImage(savedProductId, url);
            setGallery((prev) => [...prev, newImage]);
          }
        } else {
          setPendingImages((prev) => [...prev, ...uploaded]);
        }
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleGalleryImageDelete(imageId) {
    await deleteProductImage(savedProductId, imageId);
    setGallery((prev) => prev.filter((img) => img.id !== imageId));
  }

  function removePendingImage(url) {
    setPendingImages((prev) => prev.filter((u) => u !== url));
  }

  async function handleDesignAdd(e) {
    const file = e.target.files[0];
    if (!file || !savedProductId) return;
    setUploading(true);
    try {
      const result = await uploadImage(file);
      const newDesign = await addProductDesign(savedProductId, result.image_url, designName);
      setDesigns((prev) => [...prev, newDesign]);
      setDesignName("");
    } finally {
      setUploading(false);
    }
  }

  async function handleDesignDelete(designId) {
    await deleteProductDesign(savedProductId, designId);
    setDesigns((prev) => prev.filter((d) => d.id !== designId));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        discount_price: form.discount_price === "" ? null : parseFloat(form.discount_price),
        stock: parseInt(form.stock, 10),
        length_cm: form.length_cm === "" ? null : parseFloat(form.length_cm),
        width_cm: form.width_cm === "" ? null : parseFloat(form.width_cm),
        weight_min: form.weight_min === "" ? null : parseFloat(form.weight_min),
        weight_max: form.weight_max === "" ? null : parseFloat(form.weight_max),
      };

      let productId = savedProductId;
      if (isEditing) {
        await updateProduct(id, payload);
        setMessage("✅ Changes saved");
      } else {
        const created = await createProduct(payload);
        productId = created.id;
        setSavedProductId(created.id);
        setMessage("✅ Product added");
      }

      if (pendingImages.length > 0 && productId) {
        for (const url of pendingImages) {
          const newImage = await addProductImage(productId, url);
          setGallery((prev) => [...prev, newImage]);
        }
        setPendingImages([]);
      }

      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="status-msg">Loading...</p>;

  return (
    <div className="container">
      <Link to="/admin" className="back-link">← Back to dashboard</Link>
      <h1>{isEditing ? "Edit Product" : "Add New Product"}</h1>

      {message && <p className="status-msg admin-success">{message}</p>}
      {error && <p className="status-msg status-error">{error}</p>}

      <form className="admin-form product-form-page" onSubmit={handleSubmit}>
        <label>Product Name
          <input name="name" value={form.name} onChange={handleChange} required dir="auto" />
        </label>
        <label>Description
          <textarea name="description" value={form.description} onChange={handleChange} rows={2} dir="auto" />
        </label>

        <div className="admin-form-row">
          <label>Original Price
            <input type="number" name="price" value={form.price} onChange={handleChange} min="0" step="0.01" required />
          </label>
          <label>Price After Discount (optional)
            <input type="number" name="discount_price" value={form.discount_price} onChange={handleChange} min="0" step="0.01" placeholder="Leave empty if no discount" />
          </label>
        </div>

        <label>Stock Quantity
          <input type="number" name="stock" value={form.stock} onChange={handleChange} min="0" required />
        </label>

        <label>Image
          <input type="file" accept="image/jpeg" multiple onChange={handleMainImagesChange} />
        </label>
        {uploading && <p className="upload-status">Uploading images...</p>}

        {form.image_url && (
          <div>
            <span className="admin-hint-small">Main image:</span>
            <img src={resolveImageUrl(form.image_url)} alt="Preview" className="image-preview" />
          </div>
        )}

        {pendingImages.length > 0 && (
          <div>
            <span className="admin-hint-small">Extra images (will be saved with the product automatically):</span>
            <div className="gallery-grid">
              {pendingImages.map((url) => (
                <div className="gallery-item" key={url}>
                  <img src={resolveImageUrl(url)} alt="Pending" />
                  <button type="button" onClick={() => removePendingImage(url)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <h4 className="admin-form-subtitle">Hoodie Specs (optional)</h4>
        <label>Available Colors (customer selects from these)
          <input name="colors" value={form.colors} onChange={handleChange} placeholder="Black, Navy, Gray" />
        </label>
        <label>Available Sizes (customer selects from these)
          <input name="sizes" value={form.sizes} onChange={handleChange} placeholder="S, M, L, XL" />
        </label>
        <label>Fit
          <input name="fit" value={form.fit} onChange={handleChange} placeholder="Oversized / Regular Fit" />
        </label>
        <div className="admin-form-row">
          <label>Length (cm)
            <input type="number" name="length_cm" value={form.length_cm} onChange={handleChange} min="0" />
          </label>
          <label>Width (cm)
            <input type="number" name="width_cm" value={form.width_cm} onChange={handleChange} min="0" />
          </label>
        </div>
        <div className="admin-form-row">
          <label>Suitable weight from (kg)
            <input type="number" name="weight_min" value={form.weight_min} onChange={handleChange} min="0" />
          </label>
          <label>To weight (kg)
            <input type="number" name="weight_max" value={form.weight_max} onChange={handleChange} min="0" />
          </label>
        </div>

        <button type="submit" className="btn-checkout" disabled={saving || uploading}>
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Product"}
        </button>
      </form>

      {savedProductId && gallery.length > 0 && (
        <div className="admin-form gallery-section">
          <h3>Additional Image Gallery (rotates on hover)</h3>
          <div className="gallery-grid">
            {gallery.map((img) => (
              <div className="gallery-item" key={img.id}>
                <img src={resolveImageUrl(img.image_url)} alt="Gallery" />
                <button type="button" onClick={() => handleGalleryImageDelete(img.id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {savedProductId && (
        <div className="admin-form gallery-section">
          <h3>Available Designs (print images the customer chooses from)</h3>
          <div className="gallery-grid">
            {designs.map((d) => (
              <div className="gallery-item" key={d.id}>
                <img src={resolveImageUrl(d.image_url)} alt={d.name || "Design"} />
                {d.name && <span className="gallery-item-label">{d.name}</span>}
                <button type="button" onClick={() => handleDesignDelete(d.id)}>Remove</button>
              </div>
            ))}
          </div>
          <label>Design Name (optional)
            <input type="text" value={designName} onChange={(e) => setDesignName(e.target.value)} placeholder="e.g. Eagle Design" />
          </label>
          <label>Add Design
            <input type="file" accept="image/jpeg" onChange={handleDesignAdd} />
          </label>
        </div>
      )}
    </div>
  );
}
