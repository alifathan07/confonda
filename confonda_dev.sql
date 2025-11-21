-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 21, 2025 at 01:40 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `confonda_dev`
--

-- --------------------------------------------------------

--
-- Table structure for table `affectation`
--

CREATE TABLE `affectation` (
  `id` int(11) NOT NULL,
  `chantier` varchar(191) NOT NULL,
  `montant` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `article`
--

CREATE TABLE `article` (
  `id` int(11) NOT NULL,
  `designation` varchar(191) NOT NULL,
  `demandeDePrixId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `delaiLivraison` varchar(191) DEFAULT NULL,
  `observation` varchar(191) DEFAULT NULL,
  `prixUnitaire` double DEFAULT NULL,
  `quantite` int(11) NOT NULL,
  `reference` varchar(191) DEFAULT NULL,
  `totalHt` double DEFAULT NULL,
  `unite` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `article`
--

INSERT INTO `article` (`id`, `designation`, `demandeDePrixId`, `createdAt`, `updatedAt`, `delaiLivraison`, `observation`, `prixUnitaire`, `quantite`, `reference`, `totalHt`, `unite`) VALUES
(2, 'dfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdfffdff', 3, '2025-11-09 19:20:59.933', '2025-11-15 20:08:56.033', NULL, 'xcvdfgdf', NULL, 3, NULL, NULL, '2d'),
(3, 'dfff', 4, '2025-11-09 19:21:36.317', '2025-11-09 19:21:36.317', NULL, 'xcvdfgdf', NULL, 3, NULL, NULL, '2d'),
(4, 'DFGFDG', 5, '2025-11-09 19:21:36.325', '2025-11-09 19:21:36.325', NULL, 'tfjhjf', NULL, 3, NULL, NULL, '4F'),
(5, 'dfff', 6, '2025-11-09 19:22:04.279', '2025-11-09 19:22:04.279', NULL, 'xcvdfgdf', NULL, 3, NULL, NULL, '2d'),
(6, 'DFGFDG', 6, '2025-11-09 19:22:04.279', '2025-11-09 19:22:04.279', NULL, 'tfjhjf', NULL, 3, NULL, NULL, '4F'),
(7, 'dfff', 7, '2025-11-09 19:22:24.221', '2025-11-09 19:22:24.221', NULL, 'xcvdfgdf', NULL, 3, NULL, NULL, '2d'),
(8, 'DFGFDG', 7, '2025-11-09 19:22:24.221', '2025-11-09 19:22:24.221', NULL, 'tfjhjf', NULL, 3, NULL, NULL, '4F'),
(9, 'dfff', 8, '2025-11-09 19:31:56.404', '2025-11-09 19:31:56.404', NULL, 'xcvdfgdf', NULL, 3, NULL, NULL, '2d'),
(10, 'sdfsdf', 9, '2025-11-09 19:43:33.147', '2025-11-09 19:43:33.147', NULL, 'sdfdf', NULL, 3, NULL, NULL, '3D'),
(12, 'sdfsdfkakakakakakakakaka', 11, '2025-11-11 10:40:30.441', '2025-11-13 18:11:06.291', NULL, 'sdfdf', NULL, 3, '3D', NULL, '3D'),
(13, 'cabrage', 12, '2025-11-11 11:52:17.302', '2025-11-11 11:52:17.302', NULL, 'dfgdfgfg', NULL, 5, '2', NULL, 'TTD'),
(15, 'DFGFDG', 14, '2025-11-13 14:39:38.186', '2025-11-13 14:39:38.186', NULL, 'tfjhjf', NULL, 3, '55', NULL, '4F'),
(16, 'cabrage', 15, '2025-11-13 15:00:27.777', '2025-11-13 15:00:27.777', NULL, 'dfgdfgfg', NULL, 5, '2', NULL, 'TTD'),
(17, 'dfff', 16, '2025-11-13 15:00:54.431', '2025-11-13 15:00:54.431', NULL, 'xcvdfgdf', NULL, 3, 'sss', NULL, '2d'),
(18, 'cabrage', 16, '2025-11-13 15:00:54.431', '2025-11-13 15:00:54.431', NULL, 'dfgdfgfg', NULL, 5, '2', NULL, 'TTD'),
(19, 'dfff', 17, '2025-11-13 15:01:09.692', '2025-11-13 15:01:09.692', NULL, 'xcvdfgdf', NULL, 3, 'sss', NULL, '2d'),
(20, 'cabrage', 18, '2025-11-13 15:01:09.711', '2025-11-13 15:01:09.711', NULL, 'dfgdfgfg', NULL, 5, '2', NULL, 'TTD'),
(21, 'kaka', 11, '2025-11-13 18:11:06.291', '2025-11-13 18:11:06.291', NULL, NULL, NULL, 7, '3D', NULL, '3D'),
(22, 'dfff', 19, '2025-11-13 18:13:58.094', '2025-11-13 18:14:10.894', NULL, 'xcvdfgdf', NULL, 3, 'sss', NULL, '2d'),
(23, 'dfvhnghdvfsg', 19, '2025-11-13 18:14:10.894', '2025-11-13 18:14:10.894', NULL, NULL, NULL, 6, 'ddd', NULL, '3D'),
(24, 'test', 13, '2025-11-13 18:25:50.624', '2025-11-13 18:25:50.624', NULL, NULL, NULL, 5, '3D', NULL, 'F'),
(25, 'xfdg', 20, '2025-11-13 18:41:16.888', '2025-11-13 18:41:16.888', NULL, NULL, NULL, 5, '64', NULL, '244'),
(26, 'test', 21, '2025-11-13 18:48:58.043', '2025-11-13 18:48:58.043', NULL, NULL, NULL, 7, 'test', NULL, 'etst'),
(27, 'test', 22, '2025-11-13 18:58:26.074', '2025-11-13 18:58:26.074', NULL, NULL, NULL, 3, 'dfgdfg', NULL, '5344'),
(28, 'dfgdfgdfg', 22, '2025-11-13 18:58:26.074', '2025-11-13 18:58:26.074', NULL, NULL, NULL, 5, 'dfgdfg', NULL, '34534'),
(30, 'TESTsd', 24, '2025-11-15 17:02:03.259', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 11, 'ddsss', NULL, 'dd'),
(31, 'brst', 24, '2025-11-15 17:09:26.552', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 5, '3D', NULL, '2d'),
(32, 'dfdf', 24, '2025-11-15 19:46:12.679', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, '3D', NULL, '3D'),
(33, 'fgdgf', 24, '2025-11-15 19:53:08.558', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfgdfg', NULL, 'gdfgdfg'),
(34, 'fgdfgdfg', 24, '2025-11-15 19:53:08.558', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfgdf', NULL, 'dfgdfg'),
(35, 'dfgfd', 24, '2025-11-15 19:53:08.558', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfg', NULL, 'dfgdfg'),
(36, 'dfgdfgdf', 24, '2025-11-15 19:53:08.558', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfgdfg', NULL, 'dfgdfg'),
(37, 'dfgdfg', 24, '2025-11-15 19:53:08.558', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfg', NULL, 'dfgdfg'),
(38, 'dfgdfgdfg', 24, '2025-11-15 19:53:08.558', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfg', NULL, 'dfgdfg'),
(39, 'dfgdfgdfgdf', 24, '2025-11-15 19:53:08.558', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfg', NULL, 'dfgdfg'),
(40, 'dfgdfgdfgfd', 24, '2025-11-15 19:53:08.558', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfg', NULL, 'dfgdfg'),
(41, 'dgdfgdfg', 24, '2025-11-15 19:53:08.558', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfg', NULL, 'dfgdfgdgf'),
(42, 'cbchgfh', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfhdh', NULL, 'dhdfhdfh'),
(43, 'dfhdfh', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dhdfhdfh', NULL, 'dfhdfhdfhdfh'),
(44, 'fhdfhdfhdfh', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfhdfhdfh', NULL, 'dfhdfh'),
(45, 'dfhdfhdfhdh', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfhdfhdf', NULL, 'dfhdfh'),
(46, 'dfhdfhdfh', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfhdfhdfh', NULL, 'dfhdfh'),
(47, 'dfhdfhdf', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfhdfhd', NULL, 'dfhdfh'),
(48, 'dfhdfhdf', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfhdfh', NULL, 'dfhdfhd'),
(49, 'dfhdfhdfh', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfhdfh', NULL, 'dfhdfh'),
(50, 'dhdfhd', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfhdfh', NULL, 'dfhdfh'),
(51, 'dfgdfh', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfhfh', NULL, 'dfh'),
(52, 'fgdfgdfg', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfg', NULL, 'dfgdfg'),
(53, 'dfgdfgdfgdfgdfg', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfgdfg', NULL, 'dfdfg'),
(54, 'dfgdfgdfg', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfgdfg', NULL, 'dfgdfg'),
(55, 'dfgdfgdfg', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfg', NULL, 'dfgdfg'),
(56, 'dfgdfg', 24, '2025-11-15 19:54:23.432', '2025-11-15 20:16:19.951', NULL, NULL, NULL, 1, 'dfgdfg', NULL, 'dfgdg'),
(57, 'test', 25, '2025-11-16 10:59:09.430', '2025-11-16 10:59:27.273', NULL, 'dfgg', NULL, 5, 'ddd', NULL, 'ddd'),
(58, 'dfff', 26, '2025-11-16 11:01:22.564', '2025-11-16 11:01:22.564', NULL, 'xcvdfgdf', NULL, 3, 'sss', NULL, '2d'),
(59, 'DFGFDG', 26, '2025-11-16 11:01:22.564', '2025-11-16 11:01:22.564', NULL, 'tfjhjf', NULL, 3, '55', NULL, '4F'),
(60, 'sdfsdf', 26, '2025-11-16 11:01:22.564', '2025-11-16 11:01:22.564', NULL, 'sdfdsfsdf', NULL, 3, '2', NULL, '2D'),
(61, 'sdfsdf', 27, '2025-11-16 11:01:22.577', '2025-11-16 11:01:22.577', NULL, 'sdfdf', NULL, 3, '3D', NULL, '3D'),
(62, 'cabrage', 27, '2025-11-16 11:01:22.577', '2025-11-16 11:01:22.577', NULL, 'dfgdfgfg', NULL, 5, '2', NULL, 'TTD'),
(63, 'test', 28, '2025-11-16 11:04:12.894', '2025-11-16 11:04:12.894', NULL, 'dfgg', NULL, 5, 'ddd', NULL, 'ddd'),
(64, 'test', 29, '2025-11-16 12:52:22.740', '2025-11-16 12:52:22.740', NULL, 'dfgg', NULL, 5, 'ddd', NULL, 'ddd'),
(65, 'dfff', 30, '2025-11-16 13:05:14.096', '2025-11-16 13:05:14.096', NULL, 'xcvdfgdf', NULL, 3, 'sss', NULL, '2d'),
(66, 'dfff', 31, '2025-11-16 13:05:50.108', '2025-11-16 13:05:50.108', NULL, 'xcvdfgdf', NULL, 3, 'sss', NULL, '2d'),
(67, 'dfff', 32, '2025-11-16 13:06:24.973', '2025-11-16 13:06:24.973', NULL, 'xcvdfgdf', NULL, 3, 'sss', NULL, '2d'),
(68, 'DFGFDG', 32, '2025-11-16 13:06:24.973', '2025-11-16 13:06:24.973', NULL, 'tfjhjf', NULL, 3, '55', NULL, '4F'),
(69, 'sdfsdf', 32, '2025-11-16 13:06:24.973', '2025-11-16 13:06:24.973', NULL, 'sdfdsfsdf', NULL, 3, '2', NULL, '2D'),
(70, 'sdfsdf', 33, '2025-11-16 13:06:24.990', '2025-11-16 13:06:24.990', NULL, 'sdfdf', NULL, 3, '3D', NULL, '3D'),
(71, 'cabrage', 33, '2025-11-16 13:06:24.990', '2025-11-16 13:06:24.990', NULL, 'dfgdfgfg', NULL, 5, '2', NULL, 'TTD'),
(72, 'dfff', 34, '2025-11-16 19:51:01.000', '2025-11-16 19:51:01.000', NULL, 'xcvdfgdf', NULL, 3, 'sss', NULL, '2d');

-- --------------------------------------------------------

--
-- Table structure for table `attestation`
--

CREATE TABLE `attestation` (
  `id` int(11) NOT NULL,
  `fournisseurId` int(11) NOT NULL,
  `date` datetime(3) NOT NULL,
  `dateValidite` datetime(3) NOT NULL,
  `status` varchar(191) NOT NULL,
  `demandeEnvoyee` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `banque`
--

CREATE TABLE `banque` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `rib` varchar(191) NOT NULL,
  `agence` varchar(191) NOT NULL,
  `solde` double NOT NULL,
  `dateSolde` datetime(3) NOT NULL,
  `positive` double NOT NULL DEFAULT 0,
  `negative` double NOT NULL DEFAULT 0,
  `dmlt` double NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `banque`
--

INSERT INTO `banque` (`id`, `name`, `rib`, `agence`, `solde`, `dateSolde`, `positive`, `negative`, `dmlt`, `createdAt`, `updatedAt`) VALUES
(1, 'BMCE', '011780000032210001237375', 'DERB GHALLEF', 0, '2025-09-08 12:23:22.025', 900000000, 0, 0, '2025-09-08 12:23:22.026', '2025-11-08 16:53:59.185'),
(2, 'AWB', '007780000200100000143221', 'CENTRE D\'AFFAIRES 2001', 0, '2025-09-08 12:24:01.061', 0, -5401.87, -1946070.46, '2025-09-08 12:24:01.062', '2025-11-08 16:53:59.187'),
(3, 'BMCI', '013780010010150470012348', 'CASA NATIONS UNIES', 0, '2025-09-08 12:25:02.543', 107142.32, 0, -451805.39, '2025-09-08 12:25:02.544', '2025-11-08 16:53:59.187'),
(4, 'CDM', '021780000017503014649543', 'CASA IBNOU ROCHD', 0, '2025-09-08 12:25:41.614', 0, -7907.64, 0, '2025-09-08 12:25:41.615', '2025-11-08 16:53:59.187'),
(5, 'BP', '190780212112029137000102', 'CORPORATE HADJ OMAR', 0, '2025-09-08 12:26:33.894', 0, -69.76, 0, '2025-09-08 12:26:33.895', '2025-11-08 16:53:59.187'),
(7, 'CREDIT AGRICOLE', '190780212112029137000102', 'CASA NATIONS UNIES', 0, '2025-09-09 20:20:53.068', 60000000000, 0, 0, '2025-09-09 20:20:53.068', '2025-11-08 16:53:59.186');

-- --------------------------------------------------------

--
-- Table structure for table `bondecommande`
--

CREATE TABLE `bondecommande` (
  `id` int(11) NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `numero` int(11) NOT NULL,
  `fournisseurId` int(11) NOT NULL,
  `totalHt` double DEFAULT NULL,
  `tauxRemise` double DEFAULT NULL,
  `netCommercial` double DEFAULT NULL,
  `tauxTva` double DEFAULT NULL,
  `totalTtc` double DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `chantierId` int(11) DEFAULT NULL,
  `montantLettre` varchar(191) DEFAULT NULL,
  `demandeur` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bondecommande`
--

INSERT INTO `bondecommande` (`id`, `date`, `numero`, `fournisseurId`, `totalHt`, `tauxRemise`, `netCommercial`, `tauxTva`, `totalTtc`, `createdAt`, `updatedAt`, `chantierId`, `montantLettre`, `demandeur`) VALUES
(1, '2025-11-16 13:12:30.986', 2147483647, 2, NULL, NULL, NULL, NULL, NULL, '2025-11-16 13:12:30.988', '2025-11-16 13:12:30.988', NULL, NULL, NULL),
(2, '2025-11-16 13:21:29.582', 2147483647, 2, NULL, NULL, NULL, NULL, NULL, '2025-11-16 13:21:29.584', '2025-11-16 13:21:29.584', NULL, NULL, NULL),
(3, '2025-11-16 13:24:08.613', 2147483647, 2, NULL, NULL, NULL, NULL, NULL, '2025-11-16 13:24:08.615', '2025-11-16 13:24:08.615', NULL, NULL, NULL),
(4, '2025-11-16 13:24:53.560', 2147483647, 16, NULL, NULL, NULL, NULL, NULL, '2025-11-16 13:24:53.561', '2025-11-16 13:24:53.561', NULL, NULL, NULL),
(5, '2025-11-16 13:25:43.262', 2147483647, 17, NULL, NULL, NULL, NULL, NULL, '2025-11-16 13:25:43.263', '2025-11-16 13:25:43.263', NULL, NULL, NULL),
(6, '2025-11-16 13:26:01.876', 2147483647, 20, NULL, NULL, NULL, NULL, NULL, '2025-11-16 13:26:01.878', '2025-11-16 13:26:01.878', NULL, NULL, NULL),
(7, '2025-11-16 13:27:48.963', 2147483647, 37, NULL, NULL, NULL, NULL, NULL, '2025-11-16 13:27:48.965', '2025-11-16 13:27:48.965', NULL, NULL, NULL),
(8, '2025-11-16 13:28:08.401', 2147483647, 4, NULL, NULL, NULL, NULL, NULL, '2025-11-16 13:28:08.403', '2025-11-16 13:28:08.403', NULL, NULL, NULL),
(9, '2025-11-16 18:51:46.600', 2147483647, 2, NULL, NULL, NULL, NULL, NULL, '2025-11-16 18:51:46.607', '2025-11-16 18:51:46.607', NULL, NULL, NULL),
(10, '2025-11-16 18:55:01.257', 2147483647, 17, NULL, NULL, NULL, NULL, NULL, '2025-11-16 18:55:01.259', '2025-11-16 18:55:01.259', NULL, NULL, NULL),
(11, '2025-11-16 18:58:13.580', 2147483647, 16, NULL, NULL, NULL, NULL, NULL, '2025-11-16 18:58:13.582', '2025-11-16 18:58:13.582', NULL, NULL, NULL),
(12, '2025-11-16 19:22:19.565', 2147483647, 2, NULL, NULL, NULL, NULL, NULL, '2025-11-16 19:22:19.566', '2025-11-16 19:22:19.566', NULL, NULL, NULL),
(13, '2025-11-16 19:25:12.670', 2147483647, 21, NULL, NULL, NULL, NULL, NULL, '2025-11-16 19:25:12.671', '2025-11-16 19:25:12.671', NULL, NULL, NULL),
(14, '2025-11-16 19:26:38.862', 2147483647, 17, NULL, NULL, NULL, NULL, NULL, '2025-11-16 19:26:38.867', '2025-11-16 19:26:38.867', 19, NULL, NULL),
(15, '2025-11-18 00:00:00.000', 2147483647, 35, 8500, 30, 5950, 20, 7140, '2025-11-18 11:47:43.169', '2025-11-18 17:55:47.836', 17, NULL, NULL),
(16, '2025-11-18 00:00:00.000', 2147483647, 1, 600, 50, 300, 50, 450, '2025-11-18 13:47:06.577', '2025-11-18 13:47:29.940', 19, NULL, NULL),
(17, '2025-11-18 00:00:00.000', 2147483647, 1, 2543, 0, 2543, 0, 2543, '2025-11-18 14:14:04.434', '2025-11-18 18:49:12.826', NULL, 'DEUX MILLE CINQ CENT QUARANTE-TROIS DIRHAMS ET ZÉRO CENTIMES', NULL),
(18, '2025-11-18 00:00:00.000', 2147483647, 16, 150, 0, 150, 0, 150, '2025-11-18 17:59:25.555', '2025-11-18 17:59:25.555', NULL, NULL, NULL),
(19, '2025-11-18 00:00:00.000', 2147483647, 16, 40, 10, 36, 0, 36, '2025-11-18 18:03:02.216', '2025-11-18 18:03:02.216', NULL, NULL, NULL),
(20, '2025-11-18 00:00:00.000', 2147483647, 16, 750, 10, 675, 0, 675, '2025-11-18 18:09:42.202', '2025-11-18 18:09:42.202', NULL, NULL, NULL),
(21, '2025-11-18 00:00:00.000', 2147483647, 16, 1000, 0, 1000, 0, 1000, '2025-11-18 18:12:12.961', '2025-11-18 18:12:12.961', NULL, NULL, NULL),
(22, '2025-11-18 00:00:00.000', 2147483647, 16, 200, 10, 180, 0, 180, '2025-11-18 18:15:06.027', '2025-11-18 18:15:06.027', NULL, 'CENT QUATRE-VINGTS DIRHAMS ET ZÉRO CENTIMES', NULL),
(23, '2025-11-18 00:00:00.000', 2147483647, 14, 500, 50, 250, 20, 300, '2025-11-18 18:18:07.090', '2025-11-20 12:02:42.465', NULL, 'TROIS CENTS DIRHAMS ET ZÉRO CENTIMES', NULL),
(24, '2025-11-18 19:58:33.033', 2147483647, 2, NULL, NULL, NULL, NULL, NULL, '2025-11-18 19:58:33.038', '2025-11-18 19:58:33.038', 19, NULL, 'samraoui'),
(25, '2025-11-18 00:00:00.000', 2147483647, 14, 45, 0, 45, 0, 45, '2025-11-18 19:58:33.057', '2025-11-20 12:02:58.802', 19, 'QUARANTE-CINQ DIRHAMS ET ZÉRO CENTIMES', 'samraoui');

-- --------------------------------------------------------

--
-- Table structure for table `caisse`
--

CREATE TABLE `caisse` (
  `id` int(11) NOT NULL,
  `month` datetime(3) NOT NULL,
  `ancienSolde` decimal(65,30) NOT NULL DEFAULT 0.000000000000000000000000000000,
  `allocation` decimal(65,30) NOT NULL DEFAULT 0.000000000000000000000000000000,
  `chantierId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chantier`
--

CREATE TABLE `chantier` (
  `id` int(11) NOT NULL,
  `nom` varchar(191) NOT NULL,
  `clientId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `montantContratHt` double DEFAULT NULL,
  `natureContrat` varchar(191) DEFAULT NULL,
  `numContrat` varchar(191) DEFAULT NULL,
  `objet` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chantier`
--

INSERT INTO `chantier` (`id`, `nom`, `clientId`, `createdAt`, `updatedAt`, `montantContratHt`, `natureContrat`, `numContrat`, `objet`) VALUES
(3, 'siege', 38, '2025-09-12 16:58:14.000', '2025-09-21 16:05:28.250', 2345678, 'test', '1', 'asifil'),
(17, 'PORT CASA', 35, '2025-09-21 15:53:16.213', '2025-09-21 15:53:16.213', 34578, '3456', '1', 'PIEUX'),
(18, 'PORT TANGER', 35, '2025-09-21 15:54:29.153', '2025-09-21 15:54:29.153', 1900, 'test', '2', 'PIEUX'),
(19, 'CLPs', 38, '2025-09-21 16:06:55.375', '2025-09-21 17:50:37.161', 23456, 'sjhdf', '2', 'TEST'),
(25, 'Fathan', 39, '2025-10-02 22:32:09.174', '2025-10-02 22:32:09.174', 5454, 'test', '1', 'Orde de virement');

-- --------------------------------------------------------

--
-- Table structure for table `chantieritem`
--

CREATE TABLE `chantieritem` (
  `id` int(11) NOT NULL,
  `natureTravaux` varchar(191) NOT NULL,
  `numPrix` varchar(191) DEFAULT NULL,
  `designation` varchar(191) NOT NULL,
  `unite` varchar(191) DEFAULT NULL,
  `qte` double NOT NULL,
  `prixUnitaire` double NOT NULL,
  `totalHt` double NOT NULL,
  `chantierId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cheque`
--

CREATE TABLE `cheque` (
  `id` int(11) NOT NULL,
  `montant` double DEFAULT NULL,
  `dateEtablissement` datetime(3) DEFAULT NULL,
  `dateEcheance` datetime(3) DEFAULT NULL,
  `statut` varchar(191) NOT NULL,
  `dateReglement` datetime(3) DEFAULT NULL,
  `fournisseurId` int(11) NOT NULL,
  `beneficiaire` varchar(191) NOT NULL,
  `validation` tinyint(1) DEFAULT 0,
  `banqueId` int(11) NOT NULL,
  `numero` varchar(191) NOT NULL,
  `obs` varchar(191) DEFAULT NULL,
  `montantLettres` varchar(191) DEFAULT NULL,
  `ville` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `chantierId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cheque`
--

INSERT INTO `cheque` (`id`, `montant`, `dateEtablissement`, `dateEcheance`, `statut`, `dateReglement`, `fournisseurId`, `beneficiaire`, `validation`, `banqueId`, `numero`, `obs`, `montantLettres`, `ville`, `createdAt`, `updatedAt`, `chantierId`) VALUES
(1, 48371.51, '2024-03-04 00:00:00.000', '2024-05-03 00:00:00.000', 'IMPAYÉ', NULL, 1, 'JET CAR PLUS', 0, 1, '423382', 'tests', NULL, NULL, '2025-09-13 16:02:20.542', '2025-09-28 14:19:48.624', NULL),
(2, 40000, '2024-03-04 00:00:00.000', '2024-06-02 00:00:00.000', 'PAYÉ', '2025-04-18 00:00:00.000', 1, 'JET CAR PLUS', 0, 1, '423383', '', NULL, NULL, '2025-09-13 16:02:20.561', '2025-09-14 16:00:13.629', NULL),
(3, 1600000, '2024-06-03 00:00:00.000', '2024-08-04 00:00:00.000', 'Annulé', NULL, 2, 'MOJAZINE', 0, 1, '9771561', 'possession fr', NULL, NULL, '2025-09-13 16:02:20.588', '2025-09-14 15:37:43.254', NULL),
(4, 171270, '2024-09-25 00:00:00.000', '2024-12-09 00:00:00.000', 'Impayé', NULL, 3, 'FIYARS', 0, 1, '1356684', 'possession fr', NULL, NULL, '2025-09-13 16:02:20.609', '2025-09-14 15:59:20.294', 3),
(5, 193760, '2024-09-25 00:00:00.000', '2024-12-11 00:00:00.000', 'échu', NULL, 3, 'FIYARS', 0, 1, '1356685', 'aa', NULL, NULL, '2025-09-13 16:02:20.625', '2025-09-24 12:39:35.606', NULL),
(6, 145320, '2024-09-25 00:00:00.000', '2024-12-16 00:00:00.000', 'échu', NULL, 3, 'FIYARS', 0, 1, '1356686', 'possession fr', NULL, NULL, '2025-09-13 16:02:20.642', '2025-09-13 16:02:20.642', NULL),
(7, 193760, '2024-09-25 00:00:00.000', '2024-12-21 00:00:00.000', 'échu', NULL, 3, 'FIYARS', 0, 1, '1356687', 'possession fr', NULL, NULL, '2025-09-13 16:02:20.667', '2025-09-13 16:02:20.667', NULL),
(8, 60000, '2025-02-17 00:00:00.000', '2025-06-30 00:00:00.000', 'payé', '2025-07-03 00:00:00.000', 4, 'HAYTRAM', 0, 1, '1356688', NULL, NULL, NULL, '2025-09-13 16:02:20.694', '2025-09-13 16:02:20.694', NULL),
(9, 60000, '2025-02-17 00:00:00.000', '2025-08-15 00:00:00.000', 'non échu', NULL, 4, 'HAYTRAM', 0, 1, '1356689', 'possession fr', NULL, NULL, '2025-09-13 16:02:20.710', '2025-09-13 16:02:20.710', NULL),
(10, 163568.01, '2025-06-25 00:00:00.000', '2025-07-25 00:00:00.000', 'payé', '2025-08-01 00:00:00.000', 5, 'SOGELEASE', 0, 1, '1356690', NULL, NULL, NULL, '2025-09-13 16:02:20.729', '2025-09-13 16:02:20.729', NULL),
(11, 163568.01, '2025-06-25 00:00:00.000', '2025-08-24 00:00:00.000', 'Treso', NULL, 5, 'SOGELEASE', 0, 1, '1356691', 'possession fr', NULL, NULL, '2025-09-13 16:02:20.745', '2025-09-22 23:17:32.813', 3),
(13, 5000, '2025-09-14 00:00:00.000', '2025-09-14 00:00:00.000', 'Payé', NULL, 1, 'JET CAR PLUS', 0, 1, '1356692', '', NULL, 'marrakech ', '2025-09-14 15:05:01.799', '2025-09-14 15:52:52.262', NULL),
(14, 154976.72, '2025-09-14 00:00:00.000', '2023-09-14 00:00:00.000', 'EN CIRCULATION', NULL, 1, 'JET CAR PLUS', 0, 1, '123456', '', NULL, 'marrakech', '2025-09-14 15:09:55.621', '2025-09-14 15:29:01.507', NULL),
(15, 154976.72, '2025-09-14 00:00:00.000', '2025-09-14 00:00:00.000', 'PAYÉ', NULL, 3, 'FIYARS', 0, 1, '123457', '', NULL, 'rabat', '2025-09-14 15:38:33.620', '2025-09-14 15:50:20.111', 3),
(16, 2345678.72, '2025-09-14 00:00:00.000', '2025-09-14 00:00:00.000', 'EN CIRCULATION', NULL, 1, 'JET CAR PLUS', 0, 1, '77', '', NULL, 'marrakech', '2025-09-14 16:01:04.604', '2025-09-14 16:01:15.781', NULL),
(17, 154976.72, '2025-09-14 16:02:15.681', '2025-09-14 00:00:00.000', 'En circulation', NULL, 3, 'FIYARS', 0, 1, '78', NULL, NULL, 'casabalnca', '2025-09-14 16:02:15.690', '2025-09-14 16:02:15.690', NULL),
(18, 154976.72, '2025-09-14 00:00:00.000', '2025-10-12 00:00:00.000', 'EN CIRCULATION', '2022-09-12 00:00:00.000', 6, 'sormagex', 0, 1, '79', '', NULL, 'casablanca', '2025-09-14 16:16:18.594', '2025-09-15 14:33:48.610', NULL),
(19, 154976, '2025-09-17 00:00:00.000', '2025-09-17 00:00:00.000', 'EN CIRCULATION', NULL, 5, 'SOGELEASE', 0, 1, '80', '', NULL, 'rabat', '2025-09-17 17:58:29.372', '2025-09-17 18:06:18.505', 3),
(20, 1250.75, '2025-09-17 18:24:31.790', '2025-09-17 00:00:00.000', 'En circulation', NULL, 3, 'FIYARS', 0, 1, '81', NULL, NULL, 'CASABLANCA', '2025-09-17 18:24:31.796', '2025-09-17 18:24:31.796', NULL),
(21, 7855.45, '2025-09-17 00:00:00.000', '2025-09-18 00:00:00.000', 'EN CIRCULATION', NULL, 9, 'FRATA', 0, 1, '82', '', NULL, 'CASABLANCA', '2025-09-17 18:25:30.379', '2025-09-26 12:02:52.007', 17),
(22, 15222, '2025-09-17 18:40:12.735', '2025-09-17 00:00:00.000', 'En circulation', NULL, 3, 'FIYARS', 0, 1, '83', NULL, NULL, 'CASABLANCA', '2025-09-17 18:40:12.738', '2025-09-17 18:40:12.738', 3),
(23, 655454.02, '2025-09-17 00:00:00.000', '2025-09-17 00:00:00.000', 'Payé', NULL, 3, 'FIYARS', 0, 1, '84', '', NULL, 'CASABLANCA', '2025-09-17 18:41:20.106', '2025-09-18 14:22:15.608', NULL),
(24, 15000, '2025-09-21 00:00:00.000', '2022-09-21 00:00:00.000', 'EN CIRCULATION', NULL, 5, 'SOGELEASE', 0, 7, '1', '', NULL, 'casablanca', '2025-09-21 17:34:40.353', '2025-10-01 19:12:27.791', 3),
(25, 12000, '2025-09-21 00:00:00.000', '2023-09-21 00:00:00.000', 'EN CIRCULATION', NULL, 16, 'milimar', 0, 4, '2', '', NULL, NULL, '2025-09-23 15:01:58.926', '2025-09-23 15:05:54.092', 19),
(26, 42500, '2022-09-23 00:00:00.000', '2022-09-21 00:00:00.000', 'PAYÉ', NULL, 21, 'test', 0, 1, '3', 'test', NULL, NULL, '2025-09-23 15:12:09.839', '2025-09-23 15:22:12.585', 18),
(27, 3000, '2025-09-23 00:00:00.000', '2027-10-21 00:00:00.000', 'EN CIRCULATION', NULL, 25, 'jaji', 0, 3, '4', 'llm', NULL, '', '2025-09-23 15:27:51.025', '2025-09-23 15:31:18.323', 3),
(28, 154976.72, '2025-09-24 00:00:00.000', '2025-09-24 00:00:00.000', 'Payé', NULL, 32, 'hazjksdf', 0, 1, '4', '', NULL, 'casabalnca', '2025-09-24 18:18:00.696', '2025-09-26 10:35:57.474', 17),
(29, NULL, '2025-09-25 00:00:00.000', '2025-09-25 00:00:00.000', 'Annulé', NULL, 3, 'FIYARS', 0, 1, '5', '', NULL, 'casablanca', '2025-09-25 17:23:51.877', '2025-09-25 17:23:58.476', 3);

-- --------------------------------------------------------

--
-- Table structure for table `client`
--

CREATE TABLE `client` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `ice` varchar(191) NOT NULL,
  `identifFiscal` varchar(191) NOT NULL,
  `telClient` varchar(191) NOT NULL,
  `contact` varchar(191) NOT NULL,
  `telContact` varchar(191) NOT NULL,
  `address` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `client`
--

INSERT INTO `client` (`id`, `name`, `email`, `ice`, `identifFiscal`, `telClient`, `contact`, `telContact`, `address`, `createdAt`, `updatedAt`) VALUES
(35, 'TGCC', 'abfathan@gmail.com', '23456789', '3456789', '0698361022', 'FATHAN ALI mohamed', '076363868', 'Rue 3 ETG RDC APPT 4 BD CHEMINOS BLOC 23 CASA', '2025-09-21 15:52:38.768', '2025-09-21 15:52:38.768'),
(38, 'CONFONDA', 'asli@gmail.com', '666', '3456789', '0698361022', 'FATHAN ALI', '0679861809', '23', '2025-09-21 16:04:57.573', '2025-09-21 16:04:57.573'),
(39, 'somagec', '', '240162', '220467', '', '', '', '', '2025-09-28 16:56:53.324', '2025-09-28 16:56:53.324'),
(40, 'ya', '', '976174', '908393', '', '', '', '', '2025-09-28 16:57:21.167', '2025-09-28 16:57:21.167'),
(41, 'serima', '', '222568', '698536', '', '', '', '', '2025-09-28 16:58:11.129', '2025-09-28 16:58:11.129'),
(42, 'lkj', '', '706753', '782246', '', '', '', '', '2025-09-28 17:02:29.420', '2025-09-28 17:02:29.420'),
(43, 'test', '', '719031', '363652', '', '', '', '', '2025-09-28 17:06:22.643', '2025-09-28 17:06:22.643');

-- --------------------------------------------------------

--
-- Table structure for table `commandesitems`
--

CREATE TABLE `commandesitems` (
  `id` int(11) NOT NULL,
  `designation` varchar(191) NOT NULL,
  `unite` varchar(191) NOT NULL,
  `quantite` int(11) NOT NULL,
  `prixUnitaire` double DEFAULT NULL,
  `totalHt` double DEFAULT NULL,
  `bondeCommandeId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `commandesitems`
--

INSERT INTO `commandesitems` (`id`, `designation`, `unite`, `quantite`, `prixUnitaire`, `totalHt`, `bondeCommandeId`, `createdAt`, `updatedAt`) VALUES
(1, 'dfff', '2d', 3, NULL, NULL, 1, '2025-11-16 13:12:30.988', '2025-11-16 13:12:30.988'),
(2, 'dfff', '2d', 3, NULL, NULL, 2, '2025-11-16 13:21:29.584', '2025-11-16 13:21:29.584'),
(3, 'dfff', '2d', 3, NULL, NULL, 3, '2025-11-16 13:24:08.615', '2025-11-16 13:24:08.615'),
(4, 'cabrage', 'TTD', 5, NULL, NULL, 4, '2025-11-16 13:24:53.561', '2025-11-16 13:24:53.561'),
(5, 'DFGFDG', '4F', 3, NULL, NULL, 5, '2025-11-16 13:25:43.263', '2025-11-16 13:25:43.263'),
(6, 'cabrage', 'TTD', 5, NULL, NULL, 6, '2025-11-16 13:26:01.878', '2025-11-16 13:26:01.878'),
(7, 'sdfsdf', '3D', 3, NULL, NULL, 7, '2025-11-16 13:27:48.965', '2025-11-16 13:27:48.965'),
(8, 'sdfsdf', '2D', 3, NULL, NULL, 8, '2025-11-16 13:28:08.403', '2025-11-16 13:28:08.403'),
(9, 'dfff', '2d', 3, NULL, NULL, 9, '2025-11-16 18:51:46.607', '2025-11-16 18:51:46.607'),
(10, 'DFGFDG', '4F', 3, NULL, NULL, 10, '2025-11-16 18:55:01.259', '2025-11-16 18:55:01.259'),
(11, 'sdfsdf', '2D', 3, NULL, NULL, 11, '2025-11-16 18:58:13.582', '2025-11-16 18:58:13.582'),
(12, 'dfff', '2d', 3, NULL, NULL, 12, '2025-11-16 19:22:19.566', '2025-11-16 19:22:19.566'),
(13, 'cabrage', 'TTD', 5, NULL, NULL, 13, '2025-11-16 19:25:12.671', '2025-11-16 19:25:12.671'),
(14, 'sdfsdf', '3D', 3, NULL, NULL, 14, '2025-11-16 19:26:38.867', '2025-11-16 19:26:38.867'),
(15, 'testsss', 'ddd', 5, 1400, 7000, 15, '2025-11-18 11:47:43.169', '2025-11-18 17:55:47.836'),
(16, 'kaka', 'UU', 100, 15, 1500, 15, '2025-11-18 13:32:50.572', '2025-11-18 17:55:47.836'),
(18, 'dfff', '2d', 3, 100, 300, 16, '2025-11-18 13:47:06.577', '2025-11-18 13:47:29.940'),
(20, 'test', 'QQ', 5, 15, 75, 17, '2025-11-18 14:14:04.434', '2025-11-18 18:49:12.826'),
(21, 'tets', 'qq', 2, 10, 20, 17, '2025-11-18 14:15:18.425', '2025-11-18 18:49:12.826'),
(22, 'fgdgfd', 'gdfgdfg', 4, 555, 2220, 17, '2025-11-18 17:28:54.311', '2025-11-18 18:49:12.826'),
(23, 'fgdfg', 'dfgdfg', 4, 15, 60, 17, '2025-11-18 17:28:54.311', '2025-11-18 18:49:12.826'),
(24, 'gdfgdfg', 'ddgfdf', 1, 20, 20, 17, '2025-11-18 17:28:54.311', '2025-11-18 18:49:12.826'),
(25, 'dfgdfg', 'dfgdfg', 3, 20, 60, 17, '2025-11-18 17:28:54.311', '2025-11-18 18:49:12.826'),
(26, 'gdfgdfg', 'fgdfg', 4, 10, 40, 17, '2025-11-18 17:28:54.311', '2025-11-18 18:49:12.826'),
(27, 'dfgdfg', 'dfgdfg', 3, 5, 15, 17, '2025-11-18 17:28:54.311', '2025-11-18 18:49:12.826'),
(28, 'gdfg', 'fgdfg', 2, 1, 2, 17, '2025-11-18 17:28:54.311', '2025-11-18 18:49:12.826'),
(29, 'dfgdfg', 'dfgdfg', 5, 3, 15, 17, '2025-11-18 17:28:54.311', '2025-11-18 18:49:12.826'),
(30, 'dfgdfg', 'dfgdfg', 8, 2, 16, 17, '2025-11-18 17:28:54.311', '2025-11-18 18:49:12.826'),
(31, 'ddfg', 'ddfgdf', 0, 0, 0, 17, '2025-11-18 17:29:44.526', '2025-11-18 18:49:12.826'),
(32, 'dfgdfg', 'dfg', 0, 0, 0, 17, '2025-11-18 17:29:44.526', '2025-11-18 18:49:12.826'),
(33, 'dfgdfg', 'dfg', 0, 0, 0, 17, '2025-11-18 17:29:44.526', '2025-11-18 18:49:12.826'),
(34, 'dfgdfg', '', 0, 0, 0, 17, '2025-11-18 17:29:44.526', '2025-11-18 18:49:12.826'),
(35, 'dfgdfg', 'dfgdfg', 0, 0, 0, 17, '2025-11-18 17:29:44.526', '2025-11-18 18:49:12.826'),
(36, 'dfgdfg', 'dfgdfg', 0, 0, 0, 17, '2025-11-18 17:29:44.526', '2025-11-18 18:49:12.826'),
(37, 'dfgdfg', 'dfgdf', 0, 0, 0, 17, '2025-11-18 17:29:44.526', '2025-11-18 18:49:12.826'),
(38, 'dfgdfg', 'dfgdfg', 0, 0, 0, 17, '2025-11-18 17:29:44.526', '2025-11-18 18:49:12.826'),
(39, 'dfgdfg', 'dfgd', 0, 0, 0, 17, '2025-11-18 17:29:44.526', '2025-11-18 18:49:12.826'),
(40, 'dfgdfg', 'dfgdfg', 0, 0, 0, 17, '2025-11-18 17:29:44.526', '2025-11-18 18:49:12.826'),
(41, 'dfgfdg', 'dfgdfg', 0, 0, 0, 17, '2025-11-18 17:29:44.526', '2025-11-18 18:49:12.826'),
(42, 'dfgdfg', 'dfgdfg', 0, 0, 0, 17, '2025-11-18 17:29:44.526', '2025-11-18 18:49:12.826'),
(43, 'dfgdfg', 'dfgdfg', 0, 0, 0, 17, '2025-11-18 17:29:44.526', '2025-11-18 18:49:12.826'),
(44, 'test', 'UI', 10, 15, 150, 18, '2025-11-18 17:59:25.555', '2025-11-18 17:59:25.555'),
(45, 'test', 'dd', 2, 20, 40, 19, '2025-11-18 18:03:02.216', '2025-11-18 18:03:02.216'),
(46, 'ddd', 'ddd', 5, 150, 750, 20, '2025-11-18 18:09:42.202', '2025-11-18 18:09:42.202'),
(47, 'test', 'dd', 5, 200, 1000, 21, '2025-11-18 18:12:12.961', '2025-11-18 18:12:12.961'),
(48, 'test', '55', 20, 10, 200, 22, '2025-11-18 18:15:06.027', '2025-11-18 18:15:06.027'),
(49, 'test', 'dd', 5, 100, 500, 23, '2025-11-18 18:18:07.090', '2025-11-20 12:02:42.465'),
(50, 'dfff', '2d', 3, NULL, NULL, 24, '2025-11-18 19:58:33.038', '2025-11-18 19:58:33.038'),
(51, 'DFGFDG', '4F', 3, 15, 45, 25, '2025-11-18 19:58:33.057', '2025-11-20 12:02:58.802');

-- --------------------------------------------------------

--
-- Table structure for table `demandecaisse`
--

CREATE TABLE `demandecaisse` (
  `id` int(11) NOT NULL,
  `designation` varchar(191) DEFAULT NULL,
  `userId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `chantierId` int(11) DEFAULT NULL,
  `dateDemande` datetime(3) DEFAULT NULL,
  `montantTotal` double DEFAULT NULL,
  `numero` int(11) DEFAULT NULL,
  `demandeur` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'En Attente',
  `color` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `demandecaisse`
--

INSERT INTO `demandecaisse` (`id`, `designation`, `userId`, `createdAt`, `updatedAt`, `chantierId`, `dateDemande`, `montantTotal`, `numero`, `demandeur`, `status`, `color`) VALUES
(56, 'Janvier-2025', 12, '2025-10-18 18:46:44.674', '2025-10-18 18:52:47.823', 17, '2025-10-18 18:46:44.650', 0, 1, 'akkaoui', 'Versée', 'gray'),
(57, 'Février-2025', 12, '2025-10-18 18:49:43.812', '2025-10-18 18:52:14.033', 17, '2025-10-18 18:49:43.809', 5000, 2, 'akkaoui', 'Versée', 'gray'),
(58, 'Mars-2025', 12, '2025-10-18 18:54:06.781', '2025-10-18 18:56:56.037', 17, '2025-10-18 18:54:06.777', 8000, 3, 'akkaoui', 'Versée', 'gray'),
(59, 'Décembre-2025', 12, '2025-10-19 01:53:12.419', '2025-10-19 01:53:29.375', 17, '2025-10-19 01:53:12.402', 900, 4, 'akkaoui', 'Versée', 'gray'),
(60, 'Décembre-2025', 12, '2025-10-19 01:54:06.013', '2025-10-19 01:54:16.088', 17, '2025-10-19 01:54:06.010', 100, 5, 'akkaoui', 'Versée', 'gray'),
(61, 'Décembre-2025', 13, '2025-10-25 14:36:51.937', '2025-10-25 14:36:51.937', 3, '2025-10-25 14:36:51.931', 8000, 1, 'Haddou', 'En Attente', 'blue'),
(62, 'Novembre-2025', 12, '2025-10-25 14:42:57.901', '2025-10-25 14:45:13.549', 17, '2025-10-25 14:42:57.895', 0, 6, 'akkaoui', 'Annulée', 'gray'),
(63, 'Décembre-2025', 12, '2025-10-25 17:02:46.777', '2025-10-25 18:56:55.224', 17, '2025-10-25 17:02:46.770', 4500, 7, 'akkaoui', 'Versée', 'gray');

-- --------------------------------------------------------

--
-- Table structure for table `demandedeprix`
--

CREATE TABLE `demandedeprix` (
  `id` int(11) NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `fournisseurId` int(11) NOT NULL,
  `devisPath` varchar(191) DEFAULT NULL,
  `sentByEmail` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `demandedeprix`
--

INSERT INTO `demandedeprix` (`id`, `date`, `fournisseurId`, `devisPath`, `sentByEmail`, `createdAt`, `updatedAt`) VALUES
(3, '2025-11-09 00:00:00.000', 1, NULL, 0, '2025-11-09 19:20:59.933', '2025-11-15 20:08:56.033'),
(4, '2025-11-09 19:21:36.316', 2, NULL, 0, '2025-11-09 19:21:36.317', '2025-11-09 19:21:36.317'),
(5, '2025-11-09 19:21:36.324', 15, NULL, 0, '2025-11-09 19:21:36.325', '2025-11-09 19:21:36.325'),
(6, '2025-11-09 19:22:04.277', 1, NULL, 0, '2025-11-09 19:22:04.279', '2025-11-09 19:22:04.279'),
(7, '2025-11-09 19:22:24.220', 1, NULL, 0, '2025-11-09 19:22:24.221', '2025-11-09 19:22:24.221'),
(8, '2025-11-09 19:31:56.402', 2, NULL, 0, '2025-11-09 19:31:56.404', '2025-11-09 19:31:56.404'),
(9, '2025-11-09 19:43:33.144', 16, NULL, 0, '2025-11-09 19:43:33.147', '2025-11-09 19:43:33.147'),
(11, '2025-11-11 00:00:00.000', 16, NULL, 0, '2025-11-11 10:40:30.441', '2025-11-13 18:11:06.291'),
(12, '2025-11-11 11:52:17.299', 16, NULL, 0, '2025-11-11 11:52:17.302', '2025-11-11 11:52:17.302'),
(13, '2025-11-13 00:00:00.000', 16, NULL, 0, '2025-11-13 14:39:02.630', '2025-11-13 18:25:50.624'),
(14, '2025-11-13 14:39:38.182', 16, NULL, 0, '2025-11-13 14:39:38.186', '2025-11-13 14:39:38.186'),
(15, '2025-11-13 15:00:27.775', 17, NULL, 0, '2025-11-13 15:00:27.777', '2025-11-13 15:00:27.777'),
(16, '2025-11-13 15:00:54.428', 1, NULL, 0, '2025-11-13 15:00:54.431', '2025-11-13 15:00:54.431'),
(17, '2025-11-13 15:01:09.690', 3, NULL, 0, '2025-11-13 15:01:09.692', '2025-11-13 15:01:09.692'),
(18, '2025-11-13 15:01:09.709', 20, NULL, 0, '2025-11-13 15:01:09.711', '2025-11-13 15:01:09.711'),
(19, '2025-11-13 00:00:00.000', 3, NULL, 0, '2025-11-13 18:13:58.094', '2025-11-13 18:14:10.894'),
(20, '2025-11-13 00:00:00.000', 16, NULL, 0, '2025-11-13 18:41:16.888', '2025-11-13 18:41:16.888'),
(21, '2025-11-13 00:00:00.000', 16, NULL, 0, '2025-11-13 18:48:58.043', '2025-11-13 18:48:58.043'),
(22, '2025-11-13 00:00:00.000', 16, NULL, 0, '2025-11-13 18:58:26.074', '2025-11-13 18:58:26.074'),
(24, '2025-11-15 00:00:00.000', 16, NULL, 0, '2025-11-15 17:02:03.259', '2025-11-15 20:16:19.951'),
(25, '2025-11-16 00:00:00.000', 4, NULL, 0, '2025-11-16 10:59:09.430', '2025-11-16 10:59:27.273'),
(26, '2025-11-16 11:01:22.563', 1, NULL, 0, '2025-11-16 11:01:22.564', '2025-11-16 11:01:22.564'),
(27, '2025-11-16 11:01:22.576', 16, NULL, 0, '2025-11-16 11:01:22.577', '2025-11-16 11:01:22.577'),
(28, '2025-11-16 11:04:12.892', 3, NULL, 0, '2025-11-16 11:04:12.894', '2025-11-16 11:04:12.894'),
(29, '2025-11-16 12:52:22.737', 2, NULL, 0, '2025-11-16 12:52:22.740', '2025-11-16 12:52:22.740'),
(30, '2025-11-16 13:05:14.094', 2, NULL, 0, '2025-11-16 13:05:14.096', '2025-11-16 13:05:14.096'),
(31, '2025-11-16 13:05:50.106', 2, NULL, 0, '2025-11-16 13:05:50.108', '2025-11-16 13:05:50.108'),
(32, '2025-11-16 13:06:24.971', 16, NULL, 0, '2025-11-16 13:06:24.973', '2025-11-16 13:06:24.973'),
(33, '2025-11-16 13:06:24.988', 18, NULL, 0, '2025-11-16 13:06:24.990', '2025-11-16 13:06:24.990'),
(34, '2025-11-16 19:51:00.999', 3, NULL, 0, '2025-11-16 19:51:01.000', '2025-11-16 19:51:01.000');

-- --------------------------------------------------------

--
-- Table structure for table `demandefourniture`
--

CREATE TABLE `demandefourniture` (
  `id` int(11) NOT NULL,
  `chantierId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `color` varchar(191) DEFAULT NULL,
  `dateDemande` datetime(3) DEFAULT NULL,
  `numero` int(11) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'En Attente',
  `userId` int(11) NOT NULL,
  `demandeur` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `demandefourniture`
--

INSERT INTO `demandefourniture` (`id`, `chantierId`, `createdAt`, `updatedAt`, `color`, `dateDemande`, `numero`, `status`, `userId`, `demandeur`) VALUES
(20, 19, '2025-11-09 13:41:37.291', '2025-11-13 15:00:15.691', 'green', '2025-09-10 23:00:00.000', 1, 'Validé', 15, 'samraoui'),
(21, 17, '2025-11-16 10:57:48.676', '2025-11-16 10:58:45.990', 'green', '2025-11-16 10:57:48.666', 1, 'Validé', 12, 'akkaoui');

-- --------------------------------------------------------

--
-- Table structure for table `demandeproduit`
--

CREATE TABLE `demandeproduit` (
  `id` int(11) NOT NULL,
  `designation` varchar(191) NOT NULL,
  `quantite` int(11) NOT NULL,
  `unite` varchar(191) DEFAULT NULL,
  `dateTot` datetime(3) DEFAULT NULL,
  `dateTard` datetime(3) DEFAULT NULL,
  `qteDemandee` int(11) DEFAULT NULL,
  `qteStockee` int(11) DEFAULT NULL,
  `qtePrevue` int(11) DEFAULT NULL,
  `qteRecue` int(11) DEFAULT NULL,
  `lot` varchar(191) DEFAULT NULL,
  `observation` varchar(191) DEFAULT NULL,
  `codeArticle` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `depensecaisse`
--

CREATE TABLE `depensecaisse` (
  `id` int(11) NOT NULL,
  `natureDepense` varchar(191) DEFAULT NULL,
  `montantJustifie` double DEFAULT NULL,
  `montantNonJustifie` double DEFAULT NULL,
  `observation` varchar(191) DEFAULT NULL,
  `dateDepense` datetime(3) DEFAULT current_timestamp(3),
  `numeroPiece` varchar(191) DEFAULT NULL,
  `imputation` varchar(191) DEFAULT NULL,
  `justifCaisseId` int(11) NOT NULL,
  `validation` tinyint(1) DEFAULT 1,
  `validerPar` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `depensecaisse`
--

INSERT INTO `depensecaisse` (`id`, `natureDepense`, `montantJustifie`, `montantNonJustifie`, `observation`, `dateDepense`, `numeroPiece`, `imputation`, `justifCaisseId`, `validation`, `validerPar`) VALUES
(65, 'jaja', 100, 0, NULL, '2025-10-18 00:00:00.000', 'makina ', 'sss', 98, 1, 'Haddou'),
(66, 'test', 50, 0, NULL, '2025-10-18 00:00:00.000', 'makina ', 'sss', 98, 1, 'Haddou'),
(67, 'jaja', 0, 30, NULL, '2025-10-18 00:00:00.000', 'makina ', 'sss', 98, 1, 'Haddou'),
(68, 'jaja', 1200, 0, NULL, '2025-10-25 00:00:00.000', 'factire', 'sss', 101, 1, NULL),
(69, 'jaja', 900, 0, NULL, '2025-10-25 00:00:00.000', 'makina ', 'sss', 101, 1, NULL),
(70, 'test', 800, 0, NULL, '2025-10-25 00:00:00.000', 'factire', 'sss', 99, 1, 'Haddou'),
(71, 'jaja', 900, 0, NULL, '2025-10-25 00:00:00.000', 'factire', 'sss', 101, 1, NULL),
(72, 'test', 100, 0, NULL, '2025-10-25 00:00:00.000', 'factire', 'sss', 101, 1, NULL),
(73, 'll', 1200, 0, NULL, '2025-10-25 00:00:00.000', 'test2', 'ali', 102, 1, NULL),
(74, '2300', 200, 0, NULL, '2025-10-25 00:00:00.000', 'test2', 'ali', 103, 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `effet`
--

CREATE TABLE `effet` (
  `id` int(11) NOT NULL,
  `montant` double DEFAULT NULL,
  `dateEtablissement` datetime(3) DEFAULT NULL,
  `dateEcheance` datetime(3) DEFAULT NULL,
  `statut` varchar(191) NOT NULL,
  `dateReglement` datetime(3) DEFAULT NULL,
  `fournisseurId` int(11) NOT NULL,
  `beneficiaire` varchar(191) NOT NULL,
  `validation` tinyint(1) DEFAULT 0,
  `banqueId` int(11) NOT NULL,
  `numero` varchar(191) NOT NULL,
  `obs` varchar(191) DEFAULT NULL,
  `dateaujou` datetime(3) DEFAULT NULL,
  `montantLettres` varchar(191) DEFAULT NULL,
  `ville` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `chantierId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `effet`
--

INSERT INTO `effet` (`id`, `montant`, `dateEtablissement`, `dateEcheance`, `statut`, `dateReglement`, `fournisseurId`, `beneficiaire`, `validation`, `banqueId`, `numero`, `obs`, `dateaujou`, `montantLettres`, `ville`, `createdAt`, `updatedAt`, `chantierId`) VALUES
(2, 154976.73, '2025-09-14 00:00:00.000', '2025-09-12 00:00:00.000', 'Payé', '2023-09-12 00:00:00.000', 3, 'FIYARS', 0, 1, '1', 'Effett égaré par fournisseurs', NULL, NULL, 'casabalnca', '2025-09-14 16:33:57.304', '2025-09-15 16:15:45.138', NULL),
(3, 154976.73, '2025-09-14 00:00:00.000', '2025-09-19 00:00:00.000', 'En Circulation', NULL, 1, 'JET CAR PLUS', 0, 1, '2', 'kaka', NULL, NULL, 'casabalnca', '2025-09-14 18:00:09.087', '2025-09-18 14:13:53.013', 3),
(4, 345678, '2025-09-14 00:00:00.000', '2025-09-14 00:00:00.000', 'PAYÉ', '2024-09-12 00:00:00.000', 15, 'kak', 0, 1, '3', 'test', NULL, NULL, '', '2025-09-14 18:16:08.297', '2025-09-23 15:09:41.676', 17),
(5, 343335676, '2025-09-23 00:00:00.000', '2027-09-14 00:00:00.000', 'EN CIRCULATION', NULL, 21, 'test', 0, 3, '4', '', NULL, NULL, '', '2025-09-23 15:10:20.659', '2025-09-23 15:15:45.045', 19),
(6, 129000, '2025-09-23 15:25:25.434', '2026-09-17 00:00:00.000', 'En circulation', NULL, 24, 'jaja', 0, 1, '5', 'post', NULL, NULL, '', '2025-09-23 15:25:25.440', '2025-09-23 15:25:25.440', 17),
(7, 1200, '2025-09-23 00:00:00.000', '2025-10-23 00:00:00.000', 'EN CIRCULATION', NULL, 26, 'testali', 0, 3, '6', 'test12', NULL, NULL, '', '2025-09-23 15:30:18.415', '2025-09-23 15:31:06.065', 18),
(8, 154976.72, '2025-09-26 00:00:00.000', '2025-09-27 00:00:00.000', 'Payé', NULL, 3, 'FIYARS', 0, 3, '7', 'chéque égaré par fr', NULL, NULL, 'casabalnca', '2025-09-25 23:27:04.161', '2025-09-26 10:33:47.904', 17);

-- --------------------------------------------------------

--
-- Table structure for table `encaissementrecu`
--

CREATE TABLE `encaissementrecu` (
  `id` int(11) NOT NULL,
  `dateEtablissement` datetime(3) NOT NULL,
  `banqueId` int(11) NOT NULL,
  `montant` double NOT NULL,
  `chantierId` int(11) DEFAULT NULL,
  `clientId` int(11) NOT NULL,
  `nDeFactureRG` varchar(191) DEFAULT NULL,
  `RG` varchar(191) DEFAULT NULL,
  `Ras_TVA` varchar(191) DEFAULT NULL,
  `Autres` varchar(191) DEFAULT NULL,
  `ResteAPayer` varchar(191) DEFAULT NULL,
  `observation` varchar(191) DEFAULT NULL,
  `type` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fournisseur`
--

CREATE TABLE `fournisseur` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `ice` varchar(191) NOT NULL,
  `rib` varchar(191) NOT NULL,
  `agence` varchar(191) DEFAULT NULL,
  `banque` varchar(191) DEFAULT NULL,
  `objet` varchar(191) DEFAULT NULL,
  `identifFiscal` varchar(191) NOT NULL,
  `telFournisseur` varchar(191) NOT NULL,
  `contact` varchar(191) NOT NULL,
  `telContact` varchar(191) NOT NULL,
  `address` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fournisseur`
--

INSERT INTO `fournisseur` (`id`, `name`, `email`, `ice`, `rib`, `agence`, `banque`, `objet`, `identifFiscal`, `telFournisseur`, `contact`, `telContact`, `address`, `createdAt`, `updatedAt`) VALUES
(1, 'JET CAR PLUS', 'fatimaezzahrafathan@gmail.com', '', '1234567899', 'sds', 'BMCO', NULL, '', '', '', '', '', '2025-09-13 16:02:20.526', '2025-11-18 19:29:04.041'),
(2, 'MOJAZINE', NULL, ' ', ' 456789', 'hay mohamadi', 'AWB', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-13 16:02:20.573', '2025-09-14 12:32:13.717'),
(3, 'FIYARS', NULL, ' ', ' 1234567899', 'US', 'JIW', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-13 16:02:20.599', '2025-09-14 19:28:46.394'),
(4, 'HAYTRAM', NULL, ' ', ' ', '', '', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-13 16:02:20.680', '2025-09-13 16:02:20.680'),
(5, 'SOGELEASE', '', '234567890', '8374980340', 'ALI', 'CIH', NULL, '123456789', '', '', '', '', '2025-09-13 16:02:20.720', '2025-09-17 18:34:39.517'),
(6, 'sormagex', 'alifathan0210@gmail.com', '12345678D9SSS', '1234567890', 'hay mohamadi', 'CIH', NULL, '12345678D9SSSbhvce', '0698361022', 'ali', '0638940422', 'Hay Sikakiyine', '2025-09-14 10:51:09.448', '2025-09-14 10:51:09.448'),
(7, 'serima', NULL, 'ICE_1757852626984', '0137800100101', 'sdsdgsdf', 'BMCO', NULL, 'FISCAL_1757852626984', 'Default', 'Default', 'Default', NULL, '2025-09-14 12:23:46.993', '2025-09-14 12:23:46.993'),
(8, '', NULL, ' ', ' ', NULL, '', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-14 16:33:23.546', '2025-09-14 16:33:23.546'),
(9, 'FRATA', NULL, ' ', ' ', NULL, '', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-14 18:04:06.552', '2025-09-14 18:04:06.552'),
(10, 'kaka', NULL, ' ', ' ', NULL, '', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-14 18:06:28.441', '2025-09-14 18:06:28.441'),
(11, 'alija', NULL, ' ', ' ', NULL, '', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-14 18:08:06.577', '2025-09-14 18:08:06.577'),
(12, 'alika', NULL, ' ', ' ', NULL, '', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-14 18:09:28.076', '2025-09-14 18:09:28.076'),
(13, 'AKA', NULL, ' ', ' ', NULL, '', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-14 18:11:27.730', '2025-09-14 18:11:27.730'),
(14, 'ali', 'alifathan0210@gmail.com', '', '', '', '', NULL, '', '', '', '', '', '2025-09-14 18:12:44.134', '2025-11-20 12:02:29.276'),
(15, 'kak', NULL, ' ', ' ', NULL, '', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-14 18:16:08.223', '2025-09-14 18:16:08.223'),
(16, 'milimar', 'abfathan@gmail.com', 'ICE_1757949230249', 'RIB_1757949230249', '', '', NULL, 'FISCAL_1757949230249', '0698361022', 'Default', 'Default', '', '2025-09-15 15:13:50.251', '2025-11-20 11:08:12.157'),
(17, 'milimat', NULL, 'ICE_1757950058882', 'RIB_1757950058882', NULL, NULL, NULL, 'FISCAL_1757950058882', 'Default', 'Default', 'Default', NULL, '2025-09-15 15:27:38.882', '2025-09-15 15:27:38.882'),
(18, 'jaj', NULL, 'ICE_1757955409753', 'RIB_1757955409755', NULL, NULL, NULL, 'FISCAL_1757955409755', 'Default', 'Default', 'Default', NULL, '2025-09-15 16:56:49.759', '2025-09-15 16:56:49.759'),
(19, 'alixxxx', NULL, 'ICE_1758277713724', 'RIB_1758277713724', NULL, NULL, NULL, 'FISCAL_1758277713724', 'Default', 'Default', 'Default', NULL, '2025-09-19 10:28:33.725', '2025-09-19 10:28:33.725'),
(20, 'yaya', NULL, 'ICE_1758278724822', 'RIB_1758278724822', NULL, NULL, NULL, 'FISCAL_1758278724822', 'Default', 'Default', 'Default', NULL, '2025-09-19 10:45:24.827', '2025-09-19 10:45:24.827'),
(21, 'test', NULL, 'ICE_1758282105329', 'RIB_1758282105329', NULL, NULL, NULL, 'FISCAL_1758282105329', 'Default', 'Default', 'Default', NULL, '2025-09-19 11:41:45.331', '2025-09-19 11:41:45.331'),
(22, 'soraflex', NULL, ' ', ' ', '', '', NULL, '', ' ', ' ', '', NULL, '2025-09-23 14:49:05.841', '2025-09-23 14:49:05.841'),
(23, 'fathan', NULL, ' ', ' ', '', '', NULL, '', ' ', ' ', '', NULL, '2025-09-23 14:57:16.595', '2025-09-23 14:57:16.595'),
(24, 'jaja', NULL, ' ', ' ', NULL, '', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-23 15:25:25.370', '2025-09-23 15:25:25.370'),
(25, 'jaji', NULL, ' ', ' ', NULL, '', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-23 15:27:50.961', '2025-09-23 15:27:50.961'),
(26, 'testali', NULL, ' ', ' ', NULL, '', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-23 15:30:18.338', '2025-09-23 15:30:18.338'),
(27, 'lopa', NULL, 'ICE_1758642603742', '0000', '0', '0', NULL, 'FISCAL_1758642603742', 'Default', 'Default', 'Default', NULL, '2025-09-23 15:50:03.747', '2025-09-23 15:50:03.747'),
(28, 'testw', NULL, 'ICE_1758647549965', 'RIB_1758647549965', NULL, NULL, NULL, 'FISCAL_1758647549965', 'Default', 'Default', 'Default', NULL, '2025-09-23 17:12:29.967', '2025-09-23 17:12:29.967'),
(29, 'testwww', NULL, 'ICE_1758647572374', 'RIB_1758647572374', NULL, NULL, NULL, 'FISCAL_1758647572374', 'Default', 'Default', 'Default', NULL, '2025-09-23 17:12:52.376', '2025-09-23 17:12:52.376'),
(30, 'lalala', NULL, 'ICE_1758647589104', 'RIB_1758647589104', NULL, NULL, NULL, 'FISCAL_1758647589104', 'Default', 'Default', 'Default', NULL, '2025-09-23 17:13:09.107', '2025-09-23 17:13:09.107'),
(31, 'skss', NULL, 'ICE_1758647616296', 'RIB_1758647616296', NULL, NULL, NULL, 'FISCAL_1758647616296', 'Default', 'Default', 'Default', NULL, '2025-09-23 17:13:36.298', '2025-09-23 17:13:36.298'),
(32, 'hazjksdf', NULL, 'ICE_1758650179254', 'RIB_1758650179254', NULL, NULL, NULL, 'FISCAL_1758650179254', 'Default', 'Default', 'Default', NULL, '2025-09-23 17:56:19.255', '2025-09-23 17:56:19.255'),
(33, 'lmamam', NULL, 'ICE_1758710026803', 'RIB_1758710026803', NULL, NULL, NULL, 'FISCAL_1758710026803', 'Default', 'Default', 'Default', NULL, '2025-09-24 10:33:46.806', '2025-09-24 10:33:46.806'),
(34, 'confonda', NULL, 'ICE_1758841946141', ' 1234567899', 'sds', 'BMCO', NULL, 'FISCAL_1758841946141', 'Default', 'Default', 'Default', NULL, '2025-09-25 23:12:26.142', '2025-09-26 00:22:05.101'),
(35, 'sksss', NULL, 'ICE_1758848246896', 'RIB_1758848246896', NULL, NULL, NULL, 'FISCAL_1758848246896', 'Default', 'Default', 'Default', NULL, '2025-09-26 00:57:26.898', '2025-09-26 00:57:26.898'),
(36, 'gorgina', NULL, 'ICE_1758848452151', 'RIB_1758848452151', NULL, NULL, NULL, 'FISCAL_1758848452151', 'Default', 'Default', 'Default', NULL, '2025-09-26 01:00:52.153', '2025-09-26 01:00:52.153'),
(37, 'kisseseger', NULL, 'ICE_1758848586061', 'RIB_1758848586061', NULL, NULL, NULL, 'FISCAL_1758848586061', 'Default', 'Default', 'Default', NULL, '2025-09-26 01:03:06.064', '2025-09-26 01:03:06.064'),
(38, 'fathans', NULL, ' ', ' ', '', '', NULL, ' ', ' ', ' ', ' ', NULL, '2025-09-28 12:56:43.412', '2025-09-28 12:56:43.412');

-- --------------------------------------------------------

--
-- Table structure for table `itemcaisse`
--

CREATE TABLE `itemcaisse` (
  `id` int(11) NOT NULL,
  `designation` varchar(191) DEFAULT NULL,
  `demandeCaisseId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `dateCaisse` datetime(3) DEFAULT NULL,
  `imputation` varchar(191) DEFAULT NULL,
  `montant` double DEFAULT NULL,
  `responsable` varchar(191) DEFAULT NULL,
  `validation` varchar(191) NOT NULL DEFAULT 'En cours',
  `validepar` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `itemcaisse`
--

INSERT INTO `itemcaisse` (`id`, `designation`, `demandeCaisseId`, `createdAt`, `updatedAt`, `dateCaisse`, `imputation`, `montant`, `responsable`, `validation`, `validepar`) VALUES
(81, 'makina dial ', 56, '2025-10-18 18:46:44.674', '2025-10-18 18:47:52.697', '2025-10-18 00:00:00.000', NULL, 8000, NULL, 'Refusée', 'Haddou'),
(82, 'Loyer', 57, '2025-10-18 18:49:43.812', '2025-10-18 18:50:14.108', '2025-10-18 00:00:00.000', NULL, 5000, NULL, 'Validée', 'Haddou'),
(83, 'test', 58, '2025-10-18 18:54:06.781', '2025-10-18 18:56:19.514', '2025-10-18 00:00:00.000', NULL, 8000, NULL, 'Validée', 'Haddou'),
(84, 'AZE', 59, '2025-10-19 01:53:12.419', '2025-10-19 01:53:12.419', '2025-10-19 00:00:00.000', NULL, 900, NULL, 'En cours', NULL),
(85, 'AZE', 60, '2025-10-19 01:54:06.013', '2025-10-19 01:54:06.013', '2025-10-19 00:00:00.000', NULL, 100, NULL, 'En cours', NULL),
(86, 'Loyer', 61, '2025-10-25 14:36:51.937', '2025-10-25 14:36:51.937', '2025-10-25 00:00:00.000', NULL, 8000, NULL, 'En cours', NULL),
(88, 'test', 63, '2025-10-25 17:02:46.777', '2025-10-25 17:02:46.777', '2025-10-25 00:00:00.000', 'ali', 1500, NULL, 'En cours', NULL),
(89, 'ali', 63, '2025-10-25 17:02:59.834', '2025-10-25 17:02:59.834', '2025-10-25 00:00:00.000', 'test', 1500, NULL, 'En cours', NULL),
(90, 'test', 63, '2025-10-25 17:03:25.236', '2025-10-25 17:03:25.236', '2025-10-25 00:00:00.000', 'test', 1500, NULL, 'En cours', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `itemfourniture`
--

CREATE TABLE `itemfourniture` (
  `id` int(11) NOT NULL,
  `code` varchar(191) DEFAULT NULL,
  `designation` varchar(191) NOT NULL,
  `unité` varchar(191) DEFAULT NULL,
  `quantité` varchar(191) DEFAULT NULL,
  `auPlutart` varchar(191) DEFAULT NULL,
  `auPlutot` varchar(191) DEFAULT NULL,
  `observation` varchar(191) DEFAULT NULL,
  `validation` tinyint(1) DEFAULT 1,
  `validepar` varchar(191) DEFAULT NULL,
  `demandeFournitureId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `lot` varchar(191) DEFAULT NULL,
  `image` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `itemfourniture`
--

INSERT INTO `itemfourniture` (`id`, `code`, `designation`, `unité`, `quantité`, `auPlutart`, `auPlutot`, `observation`, `validation`, `validepar`, `demandeFournitureId`, `createdAt`, `updatedAt`, `lot`, `image`) VALUES
(190, '1', 'dfff', '2d', '3', '2025-11-09', '2025-11-09', 'xcvdfgdf', 1, 'Haddou', 20, '2025-11-09 13:41:37.291', '2025-11-11 11:51:19.469', 'sss', NULL),
(191, '2', 'DFGFDG', '4F', '3', '2025-11-09', '2025-11-09', 'tfjhjf', 1, 'Haddou', 20, '2025-11-09 13:54:39.622', '2025-11-11 11:51:19.469', '55', NULL),
(192, '3', 'sdfsdf', '2D', '3', '2025-11-09', '2025-11-09', 'sdfdsfsdf', 1, 'Haddou', 20, '2025-11-09 14:01:12.521', '2025-11-13 15:00:15.679', '2', NULL),
(193, '4', 'sdfsdf', '3D', '3', '2025-11-09', '2025-11-09', 'sdfdf', 1, 'Haddou', 20, '2025-11-09 14:02:34.145', '2025-11-11 11:51:19.469', '3D', NULL),
(194, '5', 'cabrage', 'TTD', '5', '2025-11-11', '2025-11-11', 'dfgdfgfg', 1, 'Haddou', 20, '2025-11-11 11:51:19.438', '2025-11-11 11:51:42.231', '2', '/uploads/fournitures/1762861878109-84466050.jpg'),
(195, '2', 'test', 'ddd', '5', '2025-11-16', '2025-11-16', 'dfgg', 1, 'Haddou', 21, '2025-11-16 10:57:48.676', '2025-11-16 10:58:45.983', 'ddd', '/uploads/fournitures/1763290679513-832657308.jpeg');

-- --------------------------------------------------------

--
-- Table structure for table `justifcaisse`
--

CREATE TABLE `justifcaisse` (
  `id` int(11) NOT NULL,
  `mois` int(11) NOT NULL,
  `annee` int(11) NOT NULL,
  `designation` varchar(191) DEFAULT NULL,
  `soldePrecedent` double DEFAULT 0,
  `totalRecettes` double DEFAULT 0,
  `totalDepenses` double DEFAULT 0,
  `soldeFinal` double DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `userId` int(11) NOT NULL,
  `chantierId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `justifcaisse`
--

INSERT INTO `justifcaisse` (`id`, `mois`, `annee`, `designation`, `soldePrecedent`, `totalRecettes`, `totalDepenses`, `soldeFinal`, `createdAt`, `updatedAt`, `userId`, `chantierId`) VALUES
(98, 1, 2025, 'Janvier-2025', 100, 100, 180, 20, '2025-10-18 16:33:49.978', '2025-10-18 16:56:09.884', 17, 3),
(99, 12, 2025, 'Décembre-2025', 0, 7500, 800, 6700, '2025-10-19 01:53:29.403', '2025-11-02 12:47:17.850', 12, 17),
(101, 1, 2025, 'Justification Caisse Janvier 2025', 0, 0, 3100, -3100, '2025-10-25 18:51:20.330', '2025-10-25 18:55:46.878', 12, 17),
(102, 10, 2025, 'Octobre-2025', 1200, 200, 1200, 200, '2025-10-25 19:10:29.161', '2025-10-25 19:10:48.959', 15, 19),
(103, 11, 2025, 'Justification Caisse Novembre 2025', 200, 0, 200, 0, '2025-10-25 19:11:02.804', '2025-10-25 19:11:16.422', 15, 19);

-- --------------------------------------------------------

--
-- Table structure for table `miseadis`
--

CREATE TABLE `miseadis` (
  `id` int(11) NOT NULL,
  `beneficiaire` varchar(191) DEFAULT NULL,
  `montant` double DEFAULT NULL,
  `date` datetime(3) DEFAULT NULL,
  `dateReglement` datetime(3) DEFAULT NULL,
  `obs` varchar(191) DEFAULT NULL,
  `cin` varchar(191) DEFAULT NULL,
  `objet` varchar(191) DEFAULT NULL,
  `cause` varchar(191) DEFAULT NULL,
  `montantLettres` varchar(191) DEFAULT NULL,
  `banqueId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `chantierId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `miseadis`
--

INSERT INTO `miseadis` (`id`, `beneficiaire`, `montant`, `date`, `dateReglement`, `obs`, `cin`, `objet`, `cause`, `montantLettres`, `banqueId`, `createdAt`, `updatedAt`, `chantierId`) VALUES
(5, 'FIYARS', 154976.72, '2025-09-13 00:00:00.000', '1970-01-01 00:00:00.000', 'sss', NULL, NULL, NULL, 'CENT CINQUANTE-QUATRE MILLE NEUF CENT SOIXANTE-SEIZE DIRHAMS SOIXANTE-DOUZE CENTIMES', 1, '2025-09-16 19:46:40.434', '2025-09-21 18:10:33.546', 18),
(6, 'SOGELEASsssssssE', 12900, '2025-09-16 00:00:00.000', '1970-01-01 00:00:00.000', 'test', NULL, NULL, NULL, '', 1, '2025-09-16 19:47:28.483', '2025-09-21 18:15:41.809', 3),
(7, 'SOGELEASE', 154976.72, '2025-09-17 00:00:00.000', '1970-01-01 00:00:00.000', 'dddd', NULL, NULL, NULL, 'CENT CINQUANTE-QUATRE MILLE NEUF CENT SOIXANTE-SEIZE DIRHAMS SOIXANTE-DOUZE CENTIMES', 1, '2025-09-16 23:15:05.895', '2025-09-26 11:55:32.749', 3),
(8, 'hazjksdf', 154976.72, '2025-09-24 00:00:00.000', NULL, 'dddd', 'BJ498627', 'MISE A DISPOSITION', NULL, 'CENT CINQUANTE-QUATRE MILLE NEUF CENT SOIXANTE-SEIZE DIRHAMS SOIXANTE-DOUZE CENTIMES', 1, '2025-09-24 18:17:32.824', '2025-09-24 18:17:32.824', 17),
(9, 'SOGELEASE', 154976.72, '2025-09-24 00:00:00.000', NULL, 'ssss', 'BJ498627', 'MISE A DISPOSITION', NULL, 'CENT CINQUANTE-QUATRE MILLE NEUF CENT SOIXANTE-SEIZE DIRHAMS SOIXANTE-DOUZE CENTIMES', 1, '2025-09-24 18:32:23.740', '2025-09-24 18:32:23.740', 17);

-- --------------------------------------------------------

--
-- Table structure for table `payavenir`
--

CREATE TABLE `payavenir` (
  `id` int(11) NOT NULL,
  `designation` varchar(191) DEFAULT NULL,
  `beneficiaire` varchar(191) DEFAULT NULL,
  `montant` double DEFAULT NULL,
  `dateEcheance` datetime(3) DEFAULT NULL,
  `statut` varchar(191) DEFAULT NULL,
  `dateReglement` datetime(3) DEFAULT NULL,
  `obs` varchar(191) DEFAULT NULL,
  `validation` tinyint(1) DEFAULT 0,
  `fournisseurId` int(11) NOT NULL,
  `banqueId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `chantierId` int(11) DEFAULT NULL,
  `chantierText` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payavenir`
--

INSERT INTO `payavenir` (`id`, `designation`, `beneficiaire`, `montant`, `dateEcheance`, `statut`, `dateReglement`, `obs`, `validation`, `fournisseurId`, `banqueId`, `createdAt`, `updatedAt`, `chantierId`, `chantierText`) VALUES
(14, 'test', NULL, 13400, '2028-09-12 00:00:00.000', 'non échu', NULL, 'test', 0, 37, 1, '2025-09-26 01:03:06.087', '2025-09-26 01:10:03.818', NULL, 'PORT CASA'),
(15, 'test', NULL, 22000, '2022-09-12 00:00:00.000', 'échu', NULL, 'test', 0, 16, 3, '2025-09-26 01:09:13.781', '2025-09-26 01:14:32.848', NULL, 'PORT CASA'),
(16, 'kaka', NULL, 23000, '2027-09-12 00:00:00.000', 'impayé', NULL, 'kaka', 0, 16, 2, '2025-09-26 01:15:03.809', '2025-09-26 01:15:03.809', NULL, 'PORT CASA');

-- --------------------------------------------------------

--
-- Table structure for table `prelevement`
--

CREATE TABLE `prelevement` (
  `id` int(11) NOT NULL,
  `fournisseurId` int(11) NOT NULL,
  `dateEcheance` datetime(3) NOT NULL,
  `montant` double NOT NULL,
  `dateFinEcheance` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `recavenir`
--

CREATE TABLE `recavenir` (
  `id` int(11) NOT NULL,
  `designation` varchar(191) DEFAULT NULL,
  `beneficiaire` varchar(191) DEFAULT NULL,
  `montant` double DEFAULT NULL,
  `dateEcheance` datetime(3) DEFAULT NULL,
  `statut` varchar(191) DEFAULT NULL,
  `dateReglement` datetime(3) DEFAULT NULL,
  `obs` varchar(191) DEFAULT NULL,
  `clientId` int(11) NOT NULL,
  `banqueId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `chantierId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `recavenir`
--

INSERT INTO `recavenir` (`id`, `designation`, `beneficiaire`, `montant`, `dateEcheance`, `statut`, `dateReglement`, `obs`, `clientId`, `banqueId`, `createdAt`, `updatedAt`, `chantierId`) VALUES
(22, 'test', NULL, 14000, '2025-09-21 00:00:00.000', 'payé', NULL, 'test', 38, 1, '2025-09-21 16:06:08.577', '2025-09-21 16:53:03.839', 3),
(23, 'TEST', NULL, 677777, '2025-09-21 00:00:00.000', 'échu', NULL, 'TESTs', 35, 3, '2025-09-21 16:07:30.601', '2025-09-21 17:10:11.912', 17),
(24, 'plus', NULL, 230000, '2026-09-21 00:00:00.000', 'impayé', '2025-09-23 00:00:00.000', 'KKK', 38, 3, '2025-09-21 16:55:59.339', '2025-09-23 16:19:46.840', 3),
(25, 'zz', NULL, 1200, '2025-10-02 00:00:00.000', 'échu', '2025-09-21 00:00:00.000', 'DSSD', 38, 1, '2025-10-02 22:30:28.335', '2025-10-02 22:30:49.737', 19),
(26, 'eee', NULL, 50000, '2025-10-02 00:00:00.000', 'non échu', '2025-09-21 00:00:00.000', 'sss', 38, 2, '2025-10-02 22:30:53.054', '2025-10-02 22:31:46.693', 3),
(27, 'ssdsd', NULL, 15000, '2025-10-02 00:00:00.000', 'non échu', '2025-09-21 00:00:00.000', '21/09/2025', 35, 2, '2025-10-02 22:31:49.591', '2025-10-02 22:34:35.252', 17),
(28, 'ssdsd', NULL, 120000, '2025-10-02 00:00:00.000', 'non échu', '2025-09-21 00:00:00.000', 'dddd', 39, 2, '2025-10-02 22:34:37.879', '2025-10-02 22:34:53.722', 25),
(29, 'dsddsf', NULL, 30000, '2025-10-02 00:00:00.000', 'non échu', '2025-09-21 00:00:00.000', 'etet', 39, 1, '2025-10-02 22:34:57.859', '2025-10-02 22:34:57.859', 25);

-- --------------------------------------------------------

--
-- Table structure for table `recettecaisse`
--

CREATE TABLE `recettecaisse` (
  `id` int(11) NOT NULL,
  `source` varchar(191) DEFAULT NULL,
  `montant` double DEFAULT NULL,
  `dateRecette` datetime(3) DEFAULT current_timestamp(3),
  `justifCaisseId` int(11) NOT NULL,
  `userId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `recettecaisse`
--

INSERT INTO `recettecaisse` (`id`, `source`, `montant`, `dateRecette`, `justifCaisseId`, `userId`) VALUES
(148, 'gertert', 100, '2025-10-18 00:00:00.000', 98, 17),
(149, 'Versement demande 4', 900, '2025-10-19 00:00:00.000', 99, 12),
(150, 'Versement demande 5', 100, '2025-10-19 00:00:00.000', 99, 12),
(151, 'Versement demande 7', 4500, '2025-10-25 00:00:00.000', 99, 12),
(152, 'TEST', 200, '2025-10-25 00:00:00.000', 102, 15),
(153, 'gertert', 2000, '2025-10-26 00:00:00.000', 99, 12);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `telepaimentprelevement`
--

CREATE TABLE `telepaimentprelevement` (
  `id` int(11) NOT NULL,
  `dateEtablissement` datetime(3) NOT NULL,
  `banqueId` int(11) NOT NULL,
  `montant` double NOT NULL,
  `chantierId` int(11) DEFAULT NULL,
  `observation` varchar(191) DEFAULT NULL,
  `fournisseurId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `type` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `telepaimentprelevement`
--

INSERT INTO `telepaimentprelevement` (`id`, `dateEtablissement`, `banqueId`, `montant`, `chantierId`, `observation`, `fournisseurId`, `createdAt`, `updatedAt`, `type`) VALUES
(1, '2025-09-27 00:00:00.000', 1, 152000, 19, 'popup', 38, '2025-09-27 17:42:07.000', '2025-09-28 13:51:15.755', 'prélèvement'),
(2, '2025-09-26 00:00:00.000', 3, 120000, 19, 'alifathan', 14, '2025-09-28 12:32:18.031', '2025-09-28 13:00:38.327', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `chantierId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'grandadmin'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `email`, `password`, `name`, `chantierId`, `createdAt`, `updatedAt`, `role`) VALUES
(1, 'fathan', '$2b$10$pAyFswV.ddEwIUXEwWgYCOyzQkro0yg.QI57tQCgbJgK8//G/pORu', 'afathan', 3, '2025-09-13 15:58:48.962', '2025-09-28 19:42:27.485', 'admin'),
(9, 'alifathan0210@gmail.com', '$2b$10$iz9zzMLIeQXxyMLG5ls5NuIu1/s2UN0MOXwuzP8/kcPlziEa6G2IG', 'khbazi', 3, '2025-09-28 19:41:40.036', '2025-09-28 19:41:40.036', 'grandadmin'),
(10, 'ali@gmail.com', '$2b$10$dKqJhfYwZcXK3q8RTXYtNOUNpo6Cq3NrbLpKJZwC.7/WDGAyYPsj.', 'hanan', 3, '2025-09-28 19:43:23.410', '2025-09-28 19:43:23.410', 'admin'),
(12, 'akkaoui@akkaoui.com', '$2b$10$ud62SV5UG7TcBoXd2VSBaOgpZu60A8vbkPPhMDgU3HW.vWb7acYYC', 'akkaoui', 17, '2025-09-28 19:51:07.247', '2025-10-01 15:38:56.232', 'user'),
(13, 'Haddou@gmail.com', '$2b$10$7Rav0j.zNWZ3vYasMYSHYOffTEgQ3rJFPdgr00saa2barnLimj4pS', 'Haddou', 3, '2025-10-05 13:55:47.136', '2025-10-05 13:55:47.136', 'grandadmin'),
(15, 'samraoui@gmail.com', '$2b$10$D24xY/2k1zi6O82G4Jmgd.CIMKdEs6JC.gAphpWPRSW1iItXvVQee', 'samraoui', 19, '2025-10-05 15:14:40.939', '2025-10-07 16:45:55.801', 'user'),
(17, 'test@test.com', '$2b$10$K5qK/Pkz/4wLJ7KZwfCQGuC1vtdYs5i0NvpZrGJzDs5CmKVhI43.K', 'test', 3, '2025-10-18 15:40:46.734', '2025-10-18 15:40:46.734', 'user'),
(18, 'confonda@gmail.com', '$2b$10$CxP46ooeNWz3kb3cHKXBNumtm1m8QdQQg6/6xInrG2b8.84ep1dqS', 'CONFONDA', 3, '2025-11-02 16:34:18.183', '2025-11-02 16:34:18.183', 'grandadmin');

-- --------------------------------------------------------

--
-- Table structure for table `virement`
--

CREATE TABLE `virement` (
  `id` int(11) NOT NULL,
  `designation` varchar(191) DEFAULT NULL,
  `beneficiaire` varchar(191) DEFAULT NULL,
  `montant` double DEFAULT NULL,
  `date` datetime(3) DEFAULT NULL,
  `dateReglement` datetime(3) DEFAULT NULL,
  `obs` varchar(191) DEFAULT NULL,
  `objet` varchar(191) DEFAULT NULL,
  `cause` varchar(191) DEFAULT NULL,
  `rtgs` tinyint(1) NOT NULL DEFAULT 0,
  `srbm` tinyint(1) NOT NULL DEFAULT 0,
  `instantane` tinyint(1) NOT NULL DEFAULT 0,
  `rib` int(11) DEFAULT NULL,
  `montantLettres` varchar(191) DEFAULT NULL,
  `fournisseurId` int(11) DEFAULT NULL,
  `banqueId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `chantierId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `virement`
--

INSERT INTO `virement` (`id`, `designation`, `beneficiaire`, `montant`, `date`, `dateReglement`, `obs`, `objet`, `cause`, `rtgs`, `srbm`, `instantane`, `rib`, `montantLettres`, `fournisseurId`, `banqueId`, `createdAt`, `updatedAt`, `chantierId`) VALUES
(1, NULL, 'SOGELEASE', 1200, '2025-09-13 00:00:00.000', '2029-09-12 00:00:00.000', 'test', 'Orde de virement', NULL, 1, 0, 0, NULL, 'MILLE DEUX CENTS DIRHAMS', 5, 1, '2025-09-13 19:16:35.130', '2025-09-28 14:52:04.512', 19),
(3, NULL, 'sormagex', 12000, '2024-09-14 00:00:00.000', '2025-09-13 00:00:00.000', 'test', 'Orde de virement', NULL, 1, 0, 0, NULL, 'DOUZE MILLE DIRHAMS', 6, 1, '2025-09-14 11:03:01.028', '2025-09-23 15:58:10.758', 3),
(4, NULL, 'sormagex', 7000000, '2024-09-14 00:00:00.000', '2022-09-12 00:00:00.000', 'test', 'Orde de virement', NULL, 0, 0, 0, NULL, 'SEPT MILLIONS DIRHAMS', 6, 1, '2025-09-14 11:04:57.171', '2025-09-23 15:59:39.363', 18),
(5, NULL, 'sormagex', 154976.72, '2022-09-14 00:00:00.000', '2029-09-12 00:00:00.000', 'kakatestssssss', 'Orde de virement', NULL, 0, 0, 1, NULL, 'CENT CINQUANTE-QUATRE MILLE NEUF CENT SOIXANTE-SEIZE DIRHAMS SOIXANTE-DOUZE CENTIMES', 6, 1, '2025-09-14 11:16:54.469', '2025-09-24 12:39:23.323', 19),
(11, NULL, 'SOGELEASE', 154976.72, '2022-09-14 00:00:00.000', NULL, 'testdjhdf', 'Orde de virement', NULL, 0, 1, 0, NULL, 'CENT CINQUANTE-QUATRE MILLE NEUF CENT SOIXANTE-SEIZE DIRHAMS SOIXANTE-DOUZE CENTIMES', 5, 2, '2025-09-14 12:28:36.516', '2025-09-23 16:03:55.492', 18),
(12, NULL, 'MOJAZINE', 343000, '2021-09-11 00:00:00.000', '2026-09-12 00:00:00.000', 'testarrr', 'Orde de virement', NULL, 0, 0, 0, NULL, 'TROIS CENT QUARANTE-TROIS MILLE DIRHAMS', 2, 1, '2025-09-14 12:32:13.725', '2025-09-27 15:36:42.813', 17),
(14, NULL, 'FIYARS', 120000, '2022-09-14 00:00:00.000', '2025-09-14 00:00:00.000', 'payers has', 'Orde de virement', NULL, 1, 0, 0, NULL, 'CENT VINGT MILLE DIRHAMS', 3, 3, '2025-09-14 14:30:11.059', '2025-09-27 14:58:04.312', 3),
(22, NULL, 'milimar', 15000, '2024-09-23 00:00:00.000', NULL, '', 'Orde de virement', NULL, 0, 0, 0, NULL, 'QUINZE MILLE DIRHAMS', 16, 1, '2025-09-23 16:17:09.634', '2025-09-23 16:17:37.042', 18),
(23, NULL, 'confonda', 154976.721, '2022-09-25 00:00:00.000', NULL, 'test', 'Orde de virement', NULL, 1, 0, 0, NULL, 'CENT CINQUANTE-QUATRE MILLE NEUF CENT SOIXANTE-SEIZE DIRHAMS SOIXANTE-DOUZE CENTIMES', 34, 1, '2025-09-25 23:12:26.154', '2025-09-27 15:32:46.456', 17),
(24, NULL, 'confonda', 5000, '2021-09-26 00:00:00.000', NULL, 'sssss', 'Orde de virement', NULL, 0, 1, 0, NULL, 'CINQ MILLE DIRHAMS', 34, 2, '2025-09-26 00:22:05.132', '2025-09-27 14:57:54.741', 19);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `affectation`
--
ALTER TABLE `affectation`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `article`
--
ALTER TABLE `article`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Article_demandeDePrixId_fkey` (`demandeDePrixId`);

--
-- Indexes for table `attestation`
--
ALTER TABLE `attestation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Attestation_fournisseurId_fkey` (`fournisseurId`);

--
-- Indexes for table `banque`
--
ALTER TABLE `banque`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `bondecommande`
--
ALTER TABLE `bondecommande`
  ADD PRIMARY KEY (`id`),
  ADD KEY `BondeCommande_fournisseurId_fkey` (`fournisseurId`),
  ADD KEY `BondeCommande_chantierId_fkey` (`chantierId`);

--
-- Indexes for table `caisse`
--
ALTER TABLE `caisse`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Caisse_chantierId_month_key` (`chantierId`,`month`);

--
-- Indexes for table `chantier`
--
ALTER TABLE `chantier`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Chantier_nom_key` (`nom`),
  ADD KEY `Chantier_clientId_fkey` (`clientId`);

--
-- Indexes for table `chantieritem`
--
ALTER TABLE `chantieritem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ChantierItem_chantierId_fkey` (`chantierId`);

--
-- Indexes for table `cheque`
--
ALTER TABLE `cheque`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Cheque_banqueId_numero_key` (`banqueId`,`numero`),
  ADD KEY `Cheque_fournisseurId_fkey` (`fournisseurId`),
  ADD KEY `Cheque_chantierId_fkey` (`chantierId`);

--
-- Indexes for table `client`
--
ALTER TABLE `client`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Client_ice_key` (`ice`);

--
-- Indexes for table `commandesitems`
--
ALTER TABLE `commandesitems`
  ADD PRIMARY KEY (`id`),
  ADD KEY `commandesItems_bondeCommandeId_fkey` (`bondeCommandeId`);

--
-- Indexes for table `demandecaisse`
--
ALTER TABLE `demandecaisse`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `DemandeCaisse_userId_numero_key` (`userId`,`numero`),
  ADD KEY `DemandeCaisse_chantierId_fkey` (`chantierId`);

--
-- Indexes for table `demandedeprix`
--
ALTER TABLE `demandedeprix`
  ADD PRIMARY KEY (`id`),
  ADD KEY `DemandeDePrix_fournisseurId_fkey` (`fournisseurId`);

--
-- Indexes for table `demandefourniture`
--
ALTER TABLE `demandefourniture`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `DemandeFourniture_userId_numero_key` (`userId`,`numero`),
  ADD KEY `DemandeFourniture_chantierId_fkey` (`chantierId`);

--
-- Indexes for table `demandeproduit`
--
ALTER TABLE `demandeproduit`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `depensecaisse`
--
ALTER TABLE `depensecaisse`
  ADD PRIMARY KEY (`id`),
  ADD KEY `DepenseCaisse_justifCaisseId_fkey` (`justifCaisseId`);

--
-- Indexes for table `effet`
--
ALTER TABLE `effet`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Effet_banqueId_numero_key` (`banqueId`,`numero`),
  ADD KEY `Effet_fournisseurId_fkey` (`fournisseurId`),
  ADD KEY `Effet_chantierId_fkey` (`chantierId`);

--
-- Indexes for table `encaissementrecu`
--
ALTER TABLE `encaissementrecu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `EncaissementRecu_banqueId_fkey` (`banqueId`),
  ADD KEY `EncaissementRecu_chantierId_fkey` (`chantierId`),
  ADD KEY `EncaissementRecu_clientId_fkey` (`clientId`);

--
-- Indexes for table `fournisseur`
--
ALTER TABLE `fournisseur`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `itemcaisse`
--
ALTER TABLE `itemcaisse`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ItemCaisse_demandeCaisseId_fkey` (`demandeCaisseId`);

--
-- Indexes for table `itemfourniture`
--
ALTER TABLE `itemfourniture`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ItemFourniture_demandeFournitureId_fkey` (`demandeFournitureId`);

--
-- Indexes for table `justifcaisse`
--
ALTER TABLE `justifcaisse`
  ADD PRIMARY KEY (`id`),
  ADD KEY `JustifCaisse_userId_fkey` (`userId`),
  ADD KEY `JustifCaisse_chantierId_fkey` (`chantierId`);

--
-- Indexes for table `miseadis`
--
ALTER TABLE `miseadis`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Miseadis_banqueId_fkey` (`banqueId`),
  ADD KEY `Miseadis_chantierId_fkey` (`chantierId`);

--
-- Indexes for table `payavenir`
--
ALTER TABLE `payavenir`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Payavenir_fournisseurId_fkey` (`fournisseurId`),
  ADD KEY `Payavenir_banqueId_fkey` (`banqueId`),
  ADD KEY `Payavenir_chantierId_fkey` (`chantierId`);

--
-- Indexes for table `prelevement`
--
ALTER TABLE `prelevement`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Prelevement_fournisseurId_fkey` (`fournisseurId`);

--
-- Indexes for table `recavenir`
--
ALTER TABLE `recavenir`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Recavenir_clientId_fkey` (`clientId`),
  ADD KEY `Recavenir_banqueId_fkey` (`banqueId`),
  ADD KEY `Recavenir_chantierId_fkey` (`chantierId`);

--
-- Indexes for table `recettecaisse`
--
ALTER TABLE `recettecaisse`
  ADD PRIMARY KEY (`id`),
  ADD KEY `RecetteCaisse_justifCaisseId_fkey` (`justifCaisseId`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `telepaimentprelevement`
--
ALTER TABLE `telepaimentprelevement`
  ADD PRIMARY KEY (`id`),
  ADD KEY `TelepaimentPrelevement_banqueId_fkey` (`banqueId`),
  ADD KEY `TelepaimentPrelevement_chantierId_fkey` (`chantierId`),
  ADD KEY `TelepaimentPrelevement_fournisseurId_fkey` (`fournisseurId`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`),
  ADD UNIQUE KEY `User_name_key` (`name`),
  ADD KEY `User_chantierId_fkey` (`chantierId`);

--
-- Indexes for table `virement`
--
ALTER TABLE `virement`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Virement_fournisseurId_fkey` (`fournisseurId`),
  ADD KEY `Virement_banqueId_fkey` (`banqueId`),
  ADD KEY `Virement_chantierId_fkey` (`chantierId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `affectation`
--
ALTER TABLE `affectation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `article`
--
ALTER TABLE `article`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT for table `attestation`
--
ALTER TABLE `attestation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `banque`
--
ALTER TABLE `banque`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `bondecommande`
--
ALTER TABLE `bondecommande`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `caisse`
--
ALTER TABLE `caisse`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chantier`
--
ALTER TABLE `chantier`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `chantieritem`
--
ALTER TABLE `chantieritem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `cheque`
--
ALTER TABLE `cheque`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `client`
--
ALTER TABLE `client`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `commandesitems`
--
ALTER TABLE `commandesitems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `demandecaisse`
--
ALTER TABLE `demandecaisse`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `demandedeprix`
--
ALTER TABLE `demandedeprix`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `demandefourniture`
--
ALTER TABLE `demandefourniture`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `demandeproduit`
--
ALTER TABLE `demandeproduit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `depensecaisse`
--
ALTER TABLE `depensecaisse`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT for table `effet`
--
ALTER TABLE `effet`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `encaissementrecu`
--
ALTER TABLE `encaissementrecu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `fournisseur`
--
ALTER TABLE `fournisseur`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `itemcaisse`
--
ALTER TABLE `itemcaisse`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT for table `itemfourniture`
--
ALTER TABLE `itemfourniture`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=196;

--
-- AUTO_INCREMENT for table `justifcaisse`
--
ALTER TABLE `justifcaisse`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT for table `miseadis`
--
ALTER TABLE `miseadis`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `payavenir`
--
ALTER TABLE `payavenir`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `prelevement`
--
ALTER TABLE `prelevement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `recavenir`
--
ALTER TABLE `recavenir`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `recettecaisse`
--
ALTER TABLE `recettecaisse`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=154;

--
-- AUTO_INCREMENT for table `telepaimentprelevement`
--
ALTER TABLE `telepaimentprelevement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `virement`
--
ALTER TABLE `virement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `article`
--
ALTER TABLE `article`
  ADD CONSTRAINT `Article_demandeDePrixId_fkey` FOREIGN KEY (`demandeDePrixId`) REFERENCES `demandedeprix` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `attestation`
--
ALTER TABLE `attestation`
  ADD CONSTRAINT `Attestation_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `fournisseur` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `bondecommande`
--
ALTER TABLE `bondecommande`
  ADD CONSTRAINT `BondeCommande_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `BondeCommande_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `fournisseur` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `caisse`
--
ALTER TABLE `caisse`
  ADD CONSTRAINT `Caisse_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `chantier`
--
ALTER TABLE `chantier`
  ADD CONSTRAINT `Chantier_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `chantieritem`
--
ALTER TABLE `chantieritem`
  ADD CONSTRAINT `ChantierItem_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `cheque`
--
ALTER TABLE `cheque`
  ADD CONSTRAINT `Cheque_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `banque` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Cheque_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Cheque_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `fournisseur` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `commandesitems`
--
ALTER TABLE `commandesitems`
  ADD CONSTRAINT `commandesItems_bondeCommandeId_fkey` FOREIGN KEY (`bondeCommandeId`) REFERENCES `bondecommande` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `demandecaisse`
--
ALTER TABLE `demandecaisse`
  ADD CONSTRAINT `DemandeCaisse_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `DemandeCaisse_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `demandedeprix`
--
ALTER TABLE `demandedeprix`
  ADD CONSTRAINT `DemandeDePrix_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `fournisseur` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `demandefourniture`
--
ALTER TABLE `demandefourniture`
  ADD CONSTRAINT `DemandeFourniture_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `DemandeFourniture_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `depensecaisse`
--
ALTER TABLE `depensecaisse`
  ADD CONSTRAINT `DepenseCaisse_justifCaisseId_fkey` FOREIGN KEY (`justifCaisseId`) REFERENCES `justifcaisse` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `effet`
--
ALTER TABLE `effet`
  ADD CONSTRAINT `Effet_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `banque` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Effet_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Effet_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `fournisseur` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `encaissementrecu`
--
ALTER TABLE `encaissementrecu`
  ADD CONSTRAINT `EncaissementRecu_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `banque` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `EncaissementRecu_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `EncaissementRecu_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `itemcaisse`
--
ALTER TABLE `itemcaisse`
  ADD CONSTRAINT `ItemCaisse_demandeCaisseId_fkey` FOREIGN KEY (`demandeCaisseId`) REFERENCES `demandecaisse` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `itemfourniture`
--
ALTER TABLE `itemfourniture`
  ADD CONSTRAINT `ItemFourniture_demandeFournitureId_fkey` FOREIGN KEY (`demandeFournitureId`) REFERENCES `demandefourniture` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `justifcaisse`
--
ALTER TABLE `justifcaisse`
  ADD CONSTRAINT `JustifCaisse_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `JustifCaisse_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `miseadis`
--
ALTER TABLE `miseadis`
  ADD CONSTRAINT `Miseadis_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `banque` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Miseadis_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `payavenir`
--
ALTER TABLE `payavenir`
  ADD CONSTRAINT `Payavenir_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `banque` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Payavenir_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Payavenir_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `fournisseur` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `prelevement`
--
ALTER TABLE `prelevement`
  ADD CONSTRAINT `Prelevement_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `fournisseur` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `recavenir`
--
ALTER TABLE `recavenir`
  ADD CONSTRAINT `Recavenir_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `banque` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Recavenir_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Recavenir_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `client` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `recettecaisse`
--
ALTER TABLE `recettecaisse`
  ADD CONSTRAINT `RecetteCaisse_justifCaisseId_fkey` FOREIGN KEY (`justifCaisseId`) REFERENCES `justifcaisse` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `telepaimentprelevement`
--
ALTER TABLE `telepaimentprelevement`
  ADD CONSTRAINT `TelepaimentPrelevement_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `banque` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `TelepaimentPrelevement_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `TelepaimentPrelevement_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `fournisseur` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `User_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `virement`
--
ALTER TABLE `virement`
  ADD CONSTRAINT `Virement_banqueId_fkey` FOREIGN KEY (`banqueId`) REFERENCES `banque` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Virement_chantierId_fkey` FOREIGN KEY (`chantierId`) REFERENCES `chantier` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Virement_fournisseurId_fkey` FOREIGN KEY (`fournisseurId`) REFERENCES `fournisseur` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
