-- Add explicit display order for service types
-- This allows UI/API to show preferred ordering instead of alphabetical only.

alter table service_types
  add column if not exists display_order int;

create index if not exists idx_service_types_display_order
  on service_types(display_order);

with preferred(name, display_order) as (
  values
    ('दुबार रेशनकार्ड', 1),
    ('नवीन शिधापत्रिका', 2),
    ('शिधापत्रिकेत नाव कमी', 3),
    ('शिधापत्रिकेत नाव समाविष्ट', 4),
    ('शिधापत्रिकेत नाव दुरुस्ती', 5),
    ('शिधापत्रिकेत नाव नसल्याचा दाखला', 6),
    ('शिधापत्रिका रद्द', 7),
    ('वैद्यकीय प्रमाणपत्र', 8),
    ('१ वर्ष उत्पन्न प्रमाणपत्र', 9),
    ('३ वर्ष उत्पन्न प्रमाणपत्र', 10),
    ('डोंगरी प्रमाणपत्र', 11),
    ('वय व अधिवास प्रमाणपत्र', 12),
    ('राष्ट्रीयत्व प्रमाणपत्र', 13),
    ('अल्पभुधारक प्रमाणपत्र', 14),
    ('१५ वर्षे रहिवासी प्रमाणपत्र', 15),
    ('महिला नॉनक्रिमिलेअर प्रमाणपत्र', 16),
    ('भूमिहीन शेतमजूर प्रमाणपत्र', 17),
    ('भूमिहीन प्रमाणपत्र', 18),
    ('शेतकरी प्रमाणपत्र', 19),
    ('जात प्रमाणपत्र SC', 20),
    ('जात प्रमाणपत्र ST', 21),
    ('जात प्रमाणपत्र OBC', 22),
    ('जात प्रमाणपत्र VJNT', 23),
    ('जात प्रमाणपत्र SBC', 24),
    ('जात प्रमाणपत्र ESBC-आर्मी', 25),
    ('जात प्रमाणपत्र OBC Central', 26),
    ('जात प्रमाणपत्र SC Central', 27),
    ('जात प्रमाणपत्र ST Central', 28),
    ('सवर्ण आरक्षण प्रमाणपत्र', 29),
    ('सवर्ण आरक्षण प्रमाणपत्र Central', 30),
    ('नॉन क्रिमिलेअर जात प्रमाणपत्र', 31),
    ('श्रावणबाळ योजना', 32),
    ('संजय गांधीनिराधार योजना', 33),
    ('इंदिरागांधी योजना', 34),
    ('तात्पुरता फटका परवाना', 35)
)
update service_types s
set
  display_order = p.display_order,
  updated_at = now()
from preferred p
where s.name = p.name;
