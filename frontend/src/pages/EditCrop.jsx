import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./EditCrop.css";

function EditCrop() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    crop_name: "",
    quantity: "",
    unit: "kg",
    quality_grade: "",
    location: "",
    expected_price: "",
    description: "",
    is_organic: false,
    is_available: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCrop();
  }, [id]);

  const fetchCrop = async () => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await api.get(`/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const crop = response.data.product;

      setFormData({
        crop_name: crop.crop_name || "",
        quantity: crop.quantity || "",
        unit: crop.unit || "kg",
        quality_grade: crop.quality_grade || "",
        location: crop.location || "",
        expected_price: crop.expected_price || "",
        description: crop.description || "",
        is_organic: crop.is_organic || false,
        is_available: crop.is_available ?? true,
      });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to load crop."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem("access_token");

      await api.put(
        `/products/${id}`,
        {
          crop_name: formData.crop_name,
          quantity: Number(formData.quantity),
          unit: formData.unit,
          quality_grade: formData.quality_grade,
          location: formData.location,
          expected_price: Number(formData.expected_price),
          description: formData.description,
          is_organic: formData.is_organic,
          is_available: formData.is_available,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Crop updated successfully! 🌾");
      navigate("/farmer-dashboard");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to update crop."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-crop-page">
        <h2>Loading Crop...</h2>
      </div>
    );
  }

  return (
    <div className="edit-crop-page">
      <div className="edit-crop-card">
        <div className="edit-crop-header">
          <p>FARMER DASHBOARD</p>
          <h1>Edit Crop 🌾</h1>
          <span>Update your crop listing details</span>
        </div>

        {error && (
          <div className="edit-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-group">
              <label>Crop Name</label>
              <input
                type="text"
                name="crop_name"
                value={formData.crop_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                name="quantity"
                min="0"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Unit</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
              >
                <option value="kg">Kg</option>
                <option value="quintal">Quintal</option>
                <option value="ton">Ton</option>
              </select>
            </div>

            <div className="form-group">
              <label>Quality</label>
              <select
                name="quality_grade"
                value={formData.quality_grade}
                onChange={handleChange}
              >
                <option value="">Select Quality</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
                <option value="Premium">Premium</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Expected Price (₹)</label>
              <input
                type="number"
                name="expected_price"
                min="0"
                value={formData.expected_price}
                onChange={handleChange}
                required
              />
            </div>

          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your crop..."
            />
          </div>

          <div className="checkbox-row">
            <label>
              <input
                type="checkbox"
                name="is_organic"
                checked={formData.is_organic}
                onChange={handleChange}
              />
              Organic Crop
            </label>

            <label>
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleChange}
              />
              Available for Sale
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate("/farmer-dashboard")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-btn"
              disabled={saving}
            >
              {saving ? "Updating..." : "Update Crop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCrop;