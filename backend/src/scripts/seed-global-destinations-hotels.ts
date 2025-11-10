import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { Destination } from '../modules/shared/entities/destination.entity';
import { Hotel } from '../modules/shared/entities/hotel.entity';

const GLOBAL_DESTINATIONS: Array<{ key: string; name: string; city: string; country: string }> = [
  { key: 'antalya', name: 'Antalya', city: 'Antalya', country: 'Turkiye' },
  { key: 'side', name: 'Side', city: 'Manavgat', country: 'Turkiye' },
  { key: 'kemer', name: 'Kemer', city: 'Kemer', country: 'Turkiye' },
  { key: 'alanya', name: 'Alanya', city: 'Alanya', country: 'Turkiye' },
  { key: 'oba', name: 'Oba', city: 'Alanya', country: 'Turkiye' },
  { key: 'manavgat', name: 'Manavgat', city: 'Manavgat', country: 'Turkiye' },
  { key: 'kargicak', name: 'Kargicak', city: 'Alanya', country: 'Turkiye' },
];

const GLOBAL_HOTELS: Array<{
  name: string;
  destinationKey: string;
  starRating?: number;
  address: string;
  city: string;
  country: string;
  description?: string;
  locationUrl?: string;
}> = [
  {
    name: 'Maxx Royal Kemer Resort',
    destinationKey: 'kemer',
    starRating: 5,
    address: 'Kiriş Mah. Sahil Yolu Cad. No: 88',
    city: 'Kemer',
    country: 'Turkiye',
    description: 'Ultra lüks hizmet sunan tatil köyü.',
    locationUrl: 'https://goo.gl/maps/Nx8Gdppq3CzF4xMd8',
  },
  {
    name: 'Voyage Belek Golf & Spa',
    destinationKey: 'antalya',
    starRating: 5,
    address: 'Belek Mah. İskele Mevkii',
    city: 'Serik',
    country: 'Turkiye',
    description: 'Golf tutkunları için premium resort.',
    locationUrl: 'https://goo.gl/maps/QJ6PfyVnEHzgXoaW9',
  },
  {
    name: 'Delphin Imperial Lara',
    destinationKey: 'antalya',
    starRating: 5,
    address: 'Lara Turizm Merkezi',
    city: 'Antalya',
    country: 'Turkiye',
    description: 'Ailece tatil için lüks her şey dahil konsepti.',
    locationUrl: 'https://goo.gl/maps/qjXn5pjuLXRMJ9d69',
  },
  {
    name: 'Sunprime C-Lounge',
    destinationKey: 'oba',
    starRating: 5,
    address: 'Obagöl Mah. 4. Sok. No: 9',
    city: 'Alanya',
    country: 'Turkiye',
    description: 'Oba bölgesinde yetişkin konseptli tatil.'
  },
  {
    name: 'Hotel Grand Kaptan',
    destinationKey: 'kargicak',
    starRating: 5,
    address: 'Gol Mah. Sahil Cad. No: 90',
    city: 'Alanya',
    country: 'Turkiye',
    description: 'Denize sıfır konaklama imkanı sunar.',
  },
  {
    name: 'Sunis Kumköy Beach Resort',
    destinationKey: 'side',
    starRating: 5,
    address: 'Kumköy Mevkii',
    city: 'Side',
    country: 'Turkiye',
    description: 'Aile dostu aktivitelerle öne çıkan tatil köyü.',
  },
  {
    name: 'Manavgat Motel',
    destinationKey: 'manavgat',
    starRating: 3,
    address: 'Yayla Mah. 4014 Sok. No: 12',
    city: 'Manavgat',
    country: 'Turkiye',
    description: 'Şehrin merkezine yakın ekonomik konaklama.',
  },
  {
    name: 'Alanya Beach Hotel',
    destinationKey: 'alanya',
    starRating: 4,
    address: 'Güller Pınarı Mah. Atatürk Blv. No: 222',
    city: 'Alanya',
    country: 'Türkiye',
    description: 'Plaja yakın konumda şehir oteli.',
  },
];

async function seedGlobalDestinationsAndHotels() {
  await AppDataSource.initialize();
  try {
    const destinationRepo = AppDataSource.getRepository(Destination);
    const hotelRepo = AppDataSource.getRepository(Hotel);

    const destinationMap = new Map<string, Destination>();

    for (const dest of GLOBAL_DESTINATIONS) {
      const existing = await destinationRepo.findOne({
        where: { name: dest.name, city: dest.city, country: dest.country },
      });
      if (existing) {
        destinationMap.set(dest.key, existing);
        continue;
      }
      const created = destinationRepo.create({
        name: dest.name,
        country: dest.country,
        city: dest.city,
      });
      const saved = await destinationRepo.save(created);
      destinationMap.set(dest.key, saved);
      console.log(`Created destination ${dest.name}`);
    }

    for (const hotel of GLOBAL_HOTELS) {
      const destination = destinationMap.get(hotel.destinationKey);
      if (!destination) {
        console.warn(`Skipping hotel ${hotel.name}; destination ${hotel.destinationKey} not found.`);
        continue;
      }

      const existingHotel = await hotelRepo.findOne({ where: { name: hotel.name, city: hotel.city } });
      if (existingHotel) {
        continue;
      }

      const createdHotel = hotelRepo.create({
        name: hotel.name,
        starRating: hotel.starRating ?? 0,
        address: hotel.address,
        city: hotel.city,
        country: hotel.country,
        description: hotel.description,
        locationUrl: hotel.locationUrl,
        destinationId: destination.id,
        destination,
      });
      await hotelRepo.save(createdHotel);
      console.log(`Created hotel ${hotel.name}`);
    }

    console.log('Global destinations & hotels seeding completed.');
  } finally {
    await AppDataSource.destroy();
  }
}

seedGlobalDestinationsAndHotels().catch((error) => {
  console.error('Failed to seed global destinations/hotels', error);
  process.exit(1);
});
